// app/api/auth/weekly-digest/route.ts
// Called by a cron job (e.g. Vercel Cron) every Monday at 9am
// GET /api/auth/weekly-digest?secret=CRON_SECRET

import {NextRequest, NextResponse} from "next/server";
import {connectDB} from "@/lib/db";
import UserModel from "@/models/User";
import BlogModel from "@/models/Blog";
import {sendEmail} from "@/services/email";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function GET(req: NextRequest) {
    // Protect with a secret — set CRON_SECRET in env
    const secret = req.headers.get("x-cron-secret") || new URL(req.url).searchParams.get("secret");
    if (secret !== process.env.CRON_SECRET) {
        return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});
    }

    try {
        await connectDB();

        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        // Get all active product_admin users
        const users = await UserModel.find({
            role: "product_admin",
            isActive: true,
        }).select("name email aiCreditsUsed aiCreditsLimit plan").lean();

        let sent = 0;
        let failed = 0;

        for (const user of users) {
            try {
                const [totalBlogs, publishedBlogs, newBlogs, viewAgg] = await Promise.all([
                    BlogModel.countDocuments({tenantId: user._id}),
                    BlogModel.countDocuments({tenantId: user._id, status: "published"}),
                    BlogModel.countDocuments({tenantId: user._id, createdAt: {$gte: oneWeekAgo}}),
                    BlogModel.aggregate([
                        {$match: {tenantId: user._id, status: "published"}},
                        {$group: {_id: null, totalViews: {$sum: "$viewCount"}, avgSEO: {$avg: "$seo.seoScore"}}},
                    ]),
                ]);

                const totalViews = viewAgg[0]?.totalViews ?? 0;
                const avgSEO = Math.round(viewAgg[0]?.avgSEO ?? 0);
                const creditsLeft = user.aiCreditsLimit - user.aiCreditsUsed;
                const creditsPercent = Math.round((user.aiCreditsUsed / user.aiCreditsLimit) * 100);

                // Only send if they have some content or activity
                if (totalBlogs === 0 && user.aiCreditsUsed === 0) continue;

                await sendEmail({
                    to: user.email,
                    subject: `Your weekly SEO summary — ${new Date().toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric"
                    })}`,
                    html: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/><style>
  body{margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f4f4f5;color:#18181b;}
  .container{max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);}
  .header{background:linear-gradient(135deg,#4F46E5,#0EA5E9);padding:32px 40px;color:#fff;}
  .body{padding:40px;}
  .stat{display:inline-block;background:#f4f4f5;border-radius:12px;padding:16px 24px;margin:8px;text-align:center;min-width:120px;}
  .stat-value{font-size:28px;font-weight:700;color:#4F46E5;}
  .stat-label{font-size:13px;color:#71717a;margin-top:4px;}
  .btn{display:inline-block;background:#4F46E5;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin:20px 0;}
  .footer{padding:24px 40px;background:#f4f4f5;font-size:13px;color:#71717a;text-align:center;}
</style></head>
<body>
<div class="container">
  <div class="header">
    <h1 style="margin:0;font-size:22px;">🚀 Your Weekly SEO Summary</h1>
    <p style="margin:8px 0 0;opacity:0.8;font-size:14px;">Week ending ${new Date().toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric"
                    })}</p>
  </div>
  <div class="body">
    <p>Hi ${user.name?.split(" ")[0] ?? "there"},</p>
    <p>Here's a snapshot of your SEO Platform activity this week:</p>
    
    <div style="text-align:center;margin:24px 0;">
      <div class="stat"><div class="stat-value">${totalViews.toLocaleString()}</div><div class="stat-label">Total Views</div></div>
      <div class="stat"><div class="stat-value">${publishedBlogs}</div><div class="stat-label">Published Posts</div></div>
      <div class="stat"><div class="stat-value">${avgSEO}</div><div class="stat-label">Avg SEO Score</div></div>
      <div class="stat"><div class="stat-value">${newBlogs}</div><div class="stat-label">New This Week</div></div>
    </div>

    ${newBlogs > 0 ? `<p>✅ You created <strong>${newBlogs} new blog post${newBlogs > 1 ? "s" : ""}</strong> this week. Keep it up!</p>` : "<p>💡 <strong>Tip:</strong> Publishing at least 2 posts per week significantly improves organic traffic growth.</p>"}

    <div style="background:#f0f4ff;border-radius:8px;padding:16px;margin:16px 0;">
      <p style="margin:0;font-size:14px;color:#4F46E5;font-weight:600;">AI Credits</p>
      <div style="background:#e0e7ff;border-radius:4px;height:8px;margin:8px 0;">
        <div style="background:#4F46E5;height:8px;border-radius:4px;width:${creditsPercent}%;"></div>
      </div>
      <p style="margin:0;font-size:13px;color:#6b7280;">${user.aiCreditsUsed} used · ${creditsLeft} remaining this month</p>
    </div>

    ${creditsLeft < 5 ? `<p>⚠️ You're running low on AI credits. <a href="${APP_URL}/dashboard/admin/settings" style="color:#4F46E5;">Upgrade your plan</a> for more.</p>` : ""}

    <a href="${APP_URL}/dashboard/admin/analytics" class="btn">View Full Analytics →</a>
    
    <p style="color:#9ca3af;font-size:13px;margin-top:24px;">
      You're on the <strong>${user.plan}</strong> plan. 
      ${user.plan === "free" ? `<a href="${APP_URL}/pricing" style="color:#4F46E5;">Upgrade for more features →</a>` : ""}
    </p>
  </div>
  <div class="footer">
    © ${new Date().getFullYear()} SEO Platform · 
    <a href="${APP_URL}/dashboard/admin/settings" style="color:#4F46E5;">Manage email preferences</a>
  </div>
</div>
</body>
</html>`,
                });
                sent++;
            } catch (err) {
                console.error(`[WEEKLY_DIGEST] Failed for ${user.email}:`, err);
                failed++;
            }
        }

        return NextResponse.json({success: true, data: {sent, failed, total: users.length}});
    } catch (error) {
        console.error("[WEEKLY_DIGEST]", error);
        return NextResponse.json({success: false, error: "Internal server error"}, {status: 500});
    }
}