import type { Metadata } from "next";
import { CMSPageRenderer, generateCMSMetadata } from "@/components/shared/CMSPageRenderer";

export async function generateMetadata(): Promise<Metadata> {
  return generateCMSMetadata("terms", "Terms of Service | SEO Platform");
}

const FALLBACK_CONTENT = `
<p><em>Last updated: January 2025</em></p>

<h2>1. Acceptance of Terms</h2>
<p>By accessing or using SEO Platform ("the Service"), you agree to be bound by these Terms of Service. If you disagree with any part of these terms, you may not access the Service.</p>

<h2>2. Account Responsibilities</h2>
<p>When you create an account:</p>
<ul>
  <li>You must provide accurate and complete information</li>
  <li>You are responsible for maintaining the security of your account credentials</li>
  <li>You are responsible for all activities that occur under your account</li>
  <li>You must notify us immediately of any unauthorized access</li>
</ul>

<h2>3. Acceptable Use Policy</h2>
<p>You agree NOT to use the Service to:</p>
<ul>
  <li>Generate spam, misleading, or deceptive content</li>
  <li>Violate any applicable laws or regulations</li>
  <li>Infringe on intellectual property rights</li>
  <li>Attempt to reverse engineer or compromise our systems</li>
  <li>Scrape or extract data in unauthorized ways</li>
  <li>Generate content that is harmful, abusive, or discriminatory</li>
</ul>

<h2>4. Subscription and Payments</h2>
<ul>
  <li>Subscriptions are billed in advance on a monthly or yearly basis</li>
  <li>All prices are in USD unless stated otherwise</li>
  <li>Upgrades take effect immediately; downgrades take effect at the next billing cycle</li>
  <li>Refunds are available within 7 days of initial purchase for new subscriptions</li>
  <li>We reserve the right to change pricing with 30 days notice</li>
</ul>

<h2>5. AI Content Usage</h2>
<p>Regarding AI-generated content:</p>
<ul>
  <li>You own the content you generate using our AI tools</li>
  <li>You are responsible for reviewing AI-generated content before publishing</li>
  <li>We do not guarantee the accuracy of AI-generated content</li>
  <li>AI credits are consumed per generation request and reset monthly</li>
</ul>

<h2>6. Intellectual Property</h2>
<p>The Service and its original content, features, and functionality are owned by SEO Platform and protected by international copyright, trademark, and other intellectual property laws.</p>

<h2>7. Termination</h2>
<p>We may terminate or suspend your account at our sole discretion, without notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties.</p>

<h2>8. Limitation of Liability</h2>
<p>In no event shall SEO Platform be liable for indirect, incidental, special, or consequential damages arising from your use of the Service.</p>

<h2>9. Governing Law</h2>
<p>These Terms shall be governed by and construed in accordance with applicable laws, without regard to conflict of law provisions.</p>

<h2>10. Contact</h2>
<p>Questions about these Terms? Contact us at: <a href="mailto:legal@seoplatform.com">legal@seoplatform.com</a></p>
`;

export default function TermsPage() {
  return (
    <CMSPageRenderer
      slug="terms"
      fallbackTitle="Terms of Service"
      fallbackContent={FALLBACK_CONTENT}
      headerGradient="from-slate-700 to-slate-900"
    />
  );
}
