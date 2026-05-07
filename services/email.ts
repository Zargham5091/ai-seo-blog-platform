import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST,
    port: Number(process.env.EMAIL_SERVER_PORT),
    secure: false,
    auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
    },
});

const FROM = `"SEO Platform" <${process.env.EMAIL_FROM}>`;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

function baseTemplate(content: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <style>
    body{margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f4f4f5;color:#18181b;}
    .container{max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);}
    .header{background:linear-gradient(135deg,#4F46E5,#0EA5E9);padding:32px 40px;color:#fff;}
    .header h1{margin:0;font-size:24px;font-weight:700;}
    .body{padding:40px;}
    .footer{padding:24px 40px;background:#f4f4f5;font-size:13px;color:#71717a;text-align:center;}
    .btn{display:inline-block;background:#4F46E5;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin:20px 0;}
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><h1>🚀 SEO Platform</h1></div>
    <div class="body">${content}</div>
    <div class="footer">© ${new Date().getFullYear()} SEO Platform. All rights reserved.<br/>
    <a href="${APP_URL}/privacy" style="color:#4F46E5;text-decoration:none;">Privacy Policy</a> · 
    <a href="${APP_URL}/terms" style="color:#4F46E5;text-decoration:none;">Terms</a></div>
  </div>
</body>
</html>`;
}

export async function sendWelcomeEmail(email: string, name: string): Promise<void> {
    await transporter.sendMail({
        from: FROM,
        to: email,
        subject: "Welcome to SEO Platform! 🚀",
        html: baseTemplate(`
      <h2>Welcome, ${name}! 👋</h2>
      <p>Thank you for joining SEO Platform. You're now on the <strong>Free plan</strong> with 10 AI credits to get you started.</p>
      <p>Here's what you can do:</p>
      <ul>
        <li>🤖 Generate AI-powered blog content</li>
        <li>🔍 Research keywords and optimize SEO</li>
        <li>📝 Use our drag-and-drop blog builder</li>
        <li>📊 Track your SEO analytics</li>
      </ul>
      <a href="${APP_URL}/dashboard" class="btn">Go to Dashboard →</a>
      <p>Need help? Reply to this email or check our <a href="${APP_URL}/documentation">documentation</a>.</p>
    `),
    });
}

export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetUrl = `${APP_URL}/reset-password?token=${token}`;
    await transporter.sendMail({
        from: FROM,
        to: email,
        subject: "Reset Your Password",
        html: baseTemplate(`
      <h2>Reset Your Password</h2>
      <p>We received a request to reset your password. Click the button below to proceed. This link expires in 1 hour.</p>
      <a href="${resetUrl}" class="btn">Reset Password</a>
      <p>If you didn't request this, you can safely ignore this email.</p>
    `),
    });
}

export async function sendSubscriptionConfirmationEmail(email: string, name: string, plan: string, billingCycle: string): Promise<void> {
    await transporter.sendMail({
        from: FROM,
        to: email,
        subject: `Subscription Confirmed — ${plan.toUpperCase()} Plan 🎉`,
        html: baseTemplate(`
      <h2>Subscription Confirmed! 🎉</h2>
      <p>Hi ${name}, your <strong>${plan.toUpperCase()} plan</strong> (${billingCycle}) is now active.</p>
      <p>You now have access to all ${plan} features including enhanced AI credits and advanced SEO tools.</p>
      <a href="${APP_URL}/dashboard" class="btn">Access Your Dashboard →</a>
      <p>View your subscription details in <a href="${APP_URL}/dashboard/admin/settings">Settings</a>.</p>
    `),
    });
}

export async function sendVerificationEmail(email: string, token: string) {
    const verifyUrl = `${APP_URL}/verify-email?token=${token}`;

    await transporter.sendMail({
        from: FROM,
        to: email,
        subject: "Verify your email",
        html: baseTemplate(`
      <h2>Verify Your Email ✉️</h2>
      <p>Please verify your email to activate your account.</p>

      <a href="${verifyUrl}" style="
        display:inline-block;
        padding:12px 20px;
        color:#fff;
        text-decoration:none;
        border-radius:8px;
        font-weight:600;
        background:linear-gradient(to right, #4f46e5, #0ea5e9);
      ">
        Verify Email →
      </a>

      <p>This link expires in 15 minutes.</p>
    `),
    });
}

export async function sendTeamInviteEmail(email: string, inviterName: string, teamName: string, inviteToken: string): Promise<void> {
    const inviteUrl = `${APP_URL}/invite?token=${inviteToken}`;
    await transporter.sendMail({
        from: FROM,
        to: email,
        subject: `You've been invited to join ${teamName} on SEO Platform`,
        html: baseTemplate(`
      <h2>Team Invitation 📨</h2>
      <p><strong>${inviterName}</strong> has invited you to join their team <strong>${teamName}</strong> on SEO Platform.</p>
            <a href="${inviteUrl}" style="
              display:inline-block;
              padding:12px 20px;
              color:#fff;
              text-decoration:none;
              border-radius:8px;
              font-weight:600;
              background:linear-gradient(to right, #4f46e5, #0ea5e9);
              box-shadow:0 4px 10px rgba(0,0,0,0.15);
            ">
              Accept Invitation →
            </a> 
                 <p>This invitation expires in 7 days.</p>
    `),
    });
}


export async function sendNewsletterCampaign({
                                                 to,
                                                 toName,
                                                 subject,
                                                 htmlContent,
                                                 fromName,
                                                 fromEmail,
                                                 campaignId,
                                                 subscriberId
                                             }: {
    to: string;
    toName: string;
    subject: string;
    htmlContent: string;
    fromName: string;
    fromEmail: string;
    campaignId: string;
    subscriberId?: string;
}): Promise<void> {
    // Wrap content with base template
    const wrappedHtml = baseTemplate(htmlContent);

    // Add tracking pixel (for open rates)
    const trackingPixel = `<img src="${process.env.NEXT_PUBLIC_APP_URL}/api/newsletter/track?campaignId=${campaignId}&subscriberId=${subscriberId}" width="1" height="1" />`;

    const finalHtml = wrappedHtml.replace('</body>', `${trackingPixel}</body>`);

    await transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to: to,
        subject: subject,
        html: finalHtml,
        headers: {
            'List-Unsubscribe': `<${process.env.NEXT_PUBLIC_APP_URL}/api/newsletter/unsubscribe?campaignId=${campaignId}&email=${to}>`,
            'X-Campaign-Id': campaignId,
        }
    });
}

// services/email.ts

// ... (other imports and transporter setup remain the same)

export async function sendSupportReplyEmail(to: string, reply: string): Promise<void> {
    await transporter.sendMail({
        from: FROM,
        to: to,
        subject: `Re: Your support request — SEO Platform`,
        html: `
            <div style="font-family:-apple-system,sans-serif;max-width:560px;margin:0 auto">
              <div style="background:#4F46E5;color:white;padding:24px;border-radius:12px 12px 0 0">
                <h2 style="margin:0">Support Reply</h2>
              </div>
              <div style="background:#f9fafb;padding:24px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb;border-top:0">
                <p>Hi there,</p>
                <p>Our team has replied to your support request:</p>
                <blockquote style="border-left:4px solid #4F46E5;margin:16px 0;padding:12px 16px;background:#fff;border-radius:0 8px 8px 0">
                  ${reply}
                </blockquote>
                <p style="color:#9ca3af;font-size:13px">SEO Platform Support Team</p>
              </div>
            </div>
          `,
    });
}


// services/email.ts — ADDITIONS ONLY
//
// ADD these three functions to the BOTTOM of your existing services/email.ts
// Do NOT replace anything. Just append from the comment below.
//
// These functions use the same `transporter`, `FROM`, `APP_URL`, and
// `baseTemplate` that already exist in your file.
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// Helper — format currency for email templates
// ─────────────────────────────────────────────────────────────────────────────
function formatMoney(amount: number, currency = 'USD'): string {
    return new Intl.NumberFormat('en-US', {style: 'currency', currency}).format(amount);
}

// ─────────────────────────────────────────────────────────────────────────────
// Contact form notification → site owner
// ─────────────────────────────────────────────────────────────────────────────
export async function sendContactNotificationEmail(
    ownerUserId: string,
    siteName: string,
    fields: Record<string, string>
): Promise<void> {
    // Look up owner email — import UserModel at top of email.ts if not already
    // import UserModel from '@/models/User';
    // import { connectDB } from '@/lib/db';
    const {connectDB} = await import('@/lib/db');
    const UserModel = (await import('@/models/User')).default;
    await connectDB();
    const owner = await UserModel.findById(ownerUserId).select('email name').lean();
    if (!owner?.email) return;

    const fieldRows = Object.entries(fields)
        .map(([k, v]) => `<tr><td style="padding:8px 12px;font-weight:600;color:#374151;background:#f9fafb;width:30%;border:1px solid #e5e7eb">${k}</td><td style="padding:8px 12px;color:#111827;border:1px solid #e5e7eb">${v}</td></tr>`)
        .join('');

    await transporter.sendMail({
        from: FROM,
        to: owner.email as string,
        subject: `📬 New contact form submission — ${siteName}`,
        html: baseTemplate(`
      <h2>New Contact Form Submission</h2>
      <p>Someone submitted your contact form on <strong>${siteName}</strong>.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        ${fieldRows}
      </table>
      <a href="${APP_URL}/dashboard/admin/site/dashboard" class="btn">View in Dashboard →</a>
    `),
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// Order notification → site owner (new order received)
// ─────────────────────────────────────────────────────────────────────────────
export async function sendOrderNotificationEmail(
    ownerUserId: string,
    siteName: string,
    order: {
        orderNumber: string;
        channel: string;
        total: number;
        currency: string;
        customer: { name: string; email?: string; phone?: string };
        items: Array<{ productName: string; quantity: number; price: number }>;
    }
): Promise<void> {
    const {connectDB} = await import('@/lib/db');
    const UserModel = (await import('@/models/User')).default;
    await connectDB();
    const owner = await UserModel.findById(ownerUserId).select('email').lean();
    if (!owner?.email) return;

    const itemRows = order.items
        .map(i => `<tr>
      <td style="padding:8px 12px;border:1px solid #e5e7eb">${i.productName}</td>
      <td style="padding:8px 12px;border:1px solid #e5e7eb;text-align:center">${i.quantity}</td>
      <td style="padding:8px 12px;border:1px solid #e5e7eb;text-align:right">${formatMoney(i.price * i.quantity, order.currency)}</td>
    </tr>`)
        .join('');

    const channelBadge = order.channel === 'whatsapp' ? '💬 WhatsApp' : order.channel === 'email' ? '📧 Email' : '🛒 Direct';

    await transporter.sendMail({
        from: FROM,
        to: owner.email as string,
        subject: `🛒 New order ${order.orderNumber} — ${siteName}`,
        html: baseTemplate(`
      <h2>New Order Received! 🎉</h2>
      <p>You have a new order on <strong>${siteName}</strong> via ${channelBadge}.</p>

      <table style="width:100%;border-collapse:collapse;margin:12px 0">
        <tr>
          <td style="padding:8px 12px;font-weight:600;background:#f9fafb;border:1px solid #e5e7eb">Order #</td>
          <td style="padding:8px 12px;border:1px solid #e5e7eb;font-family:monospace">${order.orderNumber}</td>
        </tr>
        <tr>
          <td style="padding:8px 12px;font-weight:600;background:#f9fafb;border:1px solid #e5e7eb">Customer</td>
          <td style="padding:8px 12px;border:1px solid #e5e7eb">${order.customer.name}${order.customer.email ? ` · ${order.customer.email}` : ''}${order.customer.phone ? ` · ${order.customer.phone}` : ''}</td>
        </tr>
        <tr>
          <td style="padding:8px 12px;font-weight:600;background:#f9fafb;border:1px solid #e5e7eb">Total</td>
          <td style="padding:8px 12px;border:1px solid #e5e7eb;font-weight:700">${formatMoney(order.total, order.currency)}</td>
        </tr>
      </table>

      <h3 style="margin-top:24px">Items</h3>
      <table style="width:100%;border-collapse:collapse">
        <thead>
          <tr style="background:#f3f4f6">
            <th style="padding:8px 12px;border:1px solid #e5e7eb;text-align:left">Product</th>
            <th style="padding:8px 12px;border:1px solid #e5e7eb;text-align:center">Qty</th>
            <th style="padding:8px 12px;border:1px solid #e5e7eb;text-align:right">Subtotal</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="padding:8px 12px;border:1px solid #e5e7eb;font-weight:700;text-align:right">Total</td>
            <td style="padding:8px 12px;border:1px solid #e5e7eb;font-weight:700;text-align:right">${formatMoney(order.total, order.currency)}</td>
          </tr>
        </tfoot>
      </table>

      <a href="${APP_URL}/dashboard/admin/site/dashboard" class="btn">Manage Orders →</a>
    `),
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// Order confirmation → customer
// ─────────────────────────────────────────────────────────────────────────────
export async function sendOrderConfirmationEmail(
    customerEmail: string,
    customerName: string,
    order: {
        orderNumber: string;
        total: number;
        currency: string;
        items: Array<{ productName: string; quantity: number; price: number; variant?: string }>;
    }
): Promise<void> {
    const itemRows = order.items
        .map(i => `<tr>
      <td style="padding:8px 12px;border:1px solid #e5e7eb">${i.productName}${i.variant ? ` <span style="color:#6b7280;font-size:12px">(${i.variant})</span>` : ''}</td>
      <td style="padding:8px 12px;border:1px solid #e5e7eb;text-align:center">${i.quantity}</td>
      <td style="padding:8px 12px;border:1px solid #e5e7eb;text-align:right">${formatMoney(i.price * i.quantity, order.currency)}</td>
    </tr>`)
        .join('');

    await transporter.sendMail({
        from: FROM,
        to: customerEmail,
        subject: `Order confirmed — ${order.orderNumber}`,
        html: baseTemplate(`
      <h2>Thanks for your order, ${customerName}! 🎉</h2>
      <p>We've received your order and will be in touch soon to confirm the details.</p>

      <p style="font-size:13px;color:#6b7280">Order number: <strong style="font-family:monospace;color:#111827">${order.orderNumber}</strong></p>

      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <thead>
          <tr style="background:#f3f4f6">
            <th style="padding:8px 12px;border:1px solid #e5e7eb;text-align:left">Item</th>
            <th style="padding:8px 12px;border:1px solid #e5e7eb;text-align:center">Qty</th>
            <th style="padding:8px 12px;border:1px solid #e5e7eb;text-align:right">Price</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="padding:8px 12px;border:1px solid #e5e7eb;font-weight:700;text-align:right">Total</td>
            <td style="padding:8px 12px;border:1px solid #e5e7eb;font-weight:700;text-align:right">${formatMoney(order.total, order.currency)}</td>
          </tr>
        </tfoot>
      </table>

      <p style="color:#6b7280;font-size:13px">
        If you have any questions, please reply to this email.
      </p>
    `),
    });
}