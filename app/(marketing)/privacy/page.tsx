import type { Metadata } from "next";
import { CMSPageRenderer, generateCMSMetadata } from "@/components/shared/CMSPageRenderer";

export async function generateMetadata(): Promise<Metadata> {
  return generateCMSMetadata("privacy", "Privacy Policy | SEO Platform");
}

const FALLBACK_CONTENT = `
<p><em>Last updated: January 2025</em></p>

<h2>1. Information We Collect</h2>
<p>We collect information you provide directly to us, including:</p>
<ul>
  <li><strong>Account Information:</strong> Name, email address, and password when you register</li>
  <li><strong>Payment Information:</strong> Billing details processed securely via Stripe or Coinbase Commerce</li>
  <li><strong>Content Data:</strong> Blog posts, keywords, and SEO settings you create on our platform</li>
  <li><strong>Usage Data:</strong> How you interact with our platform, features used, and session information</li>
</ul>

<h2>2. How We Use Your Information</h2>
<p>We use the information we collect to:</p>
<ul>
  <li>Provide, maintain, and improve our services</li>
  <li>Process transactions and send related information</li>
  <li>Send transactional emails (account creation, subscription confirmations)</li>
  <li>Respond to your comments and questions</li>
  <li>Monitor and analyze usage patterns to improve the platform</li>
</ul>

<h2>3. Information Sharing</h2>
<p>We do not sell, trade, or otherwise transfer your personal information to third parties except:</p>
<ul>
  <li><strong>Service Providers:</strong> Stripe (payments), Cloudinary (images), OpenAI (AI features), Upstash (rate limiting)</li>
  <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
</ul>

<h2>4. Data Security</h2>
<p>We implement industry-standard security measures including:</p>
<ul>
  <li>AES-256 encryption for data at rest</li>
  <li>TLS 1.3 encryption for all data in transit</li>
  <li>Bcrypt hashing for all passwords</li>
  <li>JWT-based secure session management</li>
  <li>Regular security audits and penetration testing</li>
</ul>

<h2>5. Data Retention</h2>
<p>We retain your data for as long as your account is active. Upon account deletion, we remove your personal data within 30 days, except where required by law.</p>

<h2>6. Your Rights (GDPR)</h2>
<p>If you are in the European Economic Area, you have the right to:</p>
<ul>
  <li>Access, update, or delete your personal information</li>
  <li>Object to or restrict processing of your data</li>
  <li>Data portability</li>
  <li>Lodge a complaint with your local data protection authority</li>
</ul>

<h2>7. Cookies</h2>
<p>We use essential cookies for authentication and session management. We do not use third-party advertising cookies.</p>

<h2>8. Children's Privacy</h2>
<p>Our service is not directed to individuals under 13. We do not knowingly collect personal information from children.</p>

<h2>9. Contact Us</h2>
<p>For privacy-related questions, contact us at: <a href="mailto:privacy@seoplatform.com">privacy@seoplatform.com</a></p>
`;

export default function PrivacyPage() {
  return (
    <CMSPageRenderer
      slug="privacy"
      fallbackTitle="Privacy Policy"
      fallbackContent={FALLBACK_CONTENT}
      headerGradient="from-slate-700 to-slate-900"
    />
  );
}
