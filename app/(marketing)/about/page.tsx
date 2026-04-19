import type { Metadata } from "next";
import { CMSPageRenderer, generateCMSMetadata } from "@/components/shared/CMSPageRenderer";

export async function generateMetadata(): Promise<Metadata> {
  return generateCMSMetadata("about", "About Us | SEO Platform");
}

const FALLBACK_CONTENT = `
<h2>Our Mission</h2>
<p>We're on a mission to democratize SEO by making enterprise-grade AI tools accessible to every creator, marketer, and business — regardless of size or budget.</p>

<h2>Our Story</h2>
<p>SEO Platform was founded by a team of SEO experts and engineers who were frustrated by the complexity and cost of existing tools. We believed there had to be a better way — and we built it.</p>

<h2>What We Do</h2>
<p>We combine cutting-edge artificial intelligence with deep SEO expertise to deliver a platform that helps you:</p>
<ul>
  <li>Generate SEO-optimized content in seconds</li>
  <li>Research profitable keywords with AI assistance</li>
  <li>Build beautiful blog posts with our drag-and-drop editor</li>
  <li>Track and improve your search rankings over time</li>
</ul>

<h2>Our Values</h2>
<h3>Transparency</h3>
<p>We believe in honest, straightforward pricing and clear communication about what our tools can and cannot do.</p>

<h3>Accessibility</h3>
<p>Powerful SEO tools shouldn't be reserved for enterprise budgets. Our free tier gives everyone a real chance to grow.</p>

<h3>Innovation</h3>
<p>We continuously improve our AI models and add new features based on real user feedback.</p>

<h2>Get in Touch</h2>
<p>Have questions? We'd love to hear from you. Reach out at <a href="/contact">our contact page</a> or email us directly at hello@seoplatform.com.</p>
`;

export default function AboutPage() {
  return (
    <CMSPageRenderer
      slug="about"
      fallbackTitle="About SEO Platform"
      fallbackContent={FALLBACK_CONTENT}
      headerGradient="from-indigo-600 to-purple-600"
    />
  );
}
