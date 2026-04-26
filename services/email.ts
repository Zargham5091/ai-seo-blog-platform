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
