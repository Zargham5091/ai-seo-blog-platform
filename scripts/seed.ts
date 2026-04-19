import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI ?? "mongodb://localhost:27017/seo-platform";

// ─── Inline schemas (avoid circular imports) ──────────────────────────────────
const UserSchema = new mongoose.Schema({
  name: String, email: { type: String, unique: true }, password: String,
  image: String, role: { type: String, default: "user" },
  plan: { type: String, default: "free" },
  subscriptionStatus: { type: String, default: "inactive" },
  aiCreditsUsed: { type: Number, default: 0 },
  aiCreditsLimit: { type: Number, default: 10 },
  isActive: { type: Boolean, default: true },
  emailVerified: Date,
}, { timestamps: true });

const PlanSchema = new mongoose.Schema({
  name: String, slug: { type: String, unique: true }, description: String,
  monthlyPrice: Number, yearlyPrice: Number,
  stripePriceIdMonthly: String, stripePriceIdYearly: String,
  features: mongoose.Schema.Types.Mixed,
  isActive: { type: Boolean, default: true },
  isPopular: { type: Boolean, default: false },
  order: Number,
}, { timestamps: true });

const BlogSchema = new mongoose.Schema({
  title: String, slug: { type: String }, excerpt: String, content: String,
  blocks: [mongoose.Schema.Types.Mixed], coverImage: String,
  authorId: mongoose.Schema.Types.ObjectId,
  tenantId: mongoose.Schema.Types.ObjectId,
  status: { type: String, default: "draft" },
  seo: mongoose.Schema.Types.Mixed, tags: [String], categories: [String],
  publishedAt: Date, viewCount: { type: Number, default: 0 },
  readTime: { type: Number, default: 1 },
  isAIGenerated: { type: Boolean, default: false },
  version: { type: Number, default: 1 }, versions: [mongoose.Schema.Types.Mixed],
}, { timestamps: true });

const CMSPageSchema = new mongoose.Schema({
  slug: { type: String, unique: true }, title: String, content: String,
  blocks: [mongoose.Schema.Types.Mixed], seo: mongoose.Schema.Types.Mixed,
  isPublished: { type: Boolean, default: false },
}, { timestamps: true });

const User = mongoose.models.User ?? mongoose.model("User", UserSchema);
const Plan = mongoose.models.Plan ?? mongoose.model("Plan", PlanSchema);
const Blog = mongoose.models.Blog ?? mongoose.model("Blog", BlogSchema);
const CMSPage = mongoose.models.CMSPage ?? mongoose.model("CMSPage", CMSPageSchema);

async function seed() {
  console.log("🌱 Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("✅ Connected\n");

  // ─── Clear existing data ────────────────────────────────────────────────────
  await Promise.all([User.deleteMany({}), Plan.deleteMany({}), Blog.deleteMany({}), CMSPage.deleteMany({})]);
  console.log("🗑️  Cleared existing data");

  // ─── Users ──────────────────────────────────────────────────────────────────
  const hashedPassword = await bcrypt.hash("password123", 12);

  const superAdmin = await User.create({
    name: "Super Admin",
    email: "superadmin@seoplatform.com",
    password: hashedPassword,
    role: "super_admin",
    plan: "diamond",
    subscriptionStatus: "active",
    aiCreditsUsed: 0,
    aiCreditsLimit: 2000,
    isActive: true,
    emailVerified: new Date(),
  });

  const productAdmin = await User.create({
    name: "John Smith",
    email: "admin@example.com",
    password: hashedPassword,
    role: "product_admin",
    plan: "gold",
    subscriptionStatus: "active",
    aiCreditsUsed: 45,
    aiCreditsLimit: 500,
    isActive: true,
    emailVerified: new Date(),
  });

  const silverUser = await User.create({
    name: "Sarah Johnson",
    email: "silver@example.com",
    password: hashedPassword,
    role: "product_admin",
    plan: "silver",
    subscriptionStatus: "active",
    aiCreditsUsed: 12,
    aiCreditsLimit: 100,
    isActive: true,
    emailVerified: new Date(),
  });

  await User.create({
    name: "Free User",
    email: "free@example.com",
    password: hashedPassword,
    role: "user",
    plan: "free",
    subscriptionStatus: "inactive",
    aiCreditsUsed: 3,
    aiCreditsLimit: 10,
    isActive: true,
    emailVerified: new Date(),
  });

  console.log("👥 Created 4 users:");
  console.log("   Super Admin  → superadmin@seoplatform.com / password123");
  console.log("   Product Admin → admin@example.com / password123 (Gold)");
  console.log("   Silver User   → silver@example.com / password123");
  console.log("   Free User     → free@example.com / password123\n");

  // ─── Plans ──────────────────────────────────────────────────────────────────
  const plans = [
    {
      name: "Free", slug: "free", description: "Perfect for individuals exploring SEO tools.",
      monthlyPrice: 0, yearlyPrice: 0, order: 0, isActive: true, isPopular: false,
      features: { aiCreditsPerMonth: 10, maxBlogs: 3, maxTeamMembers: 1, advancedSEO: false, analytics: false, customDomain: false, prioritySupport: false, apiAccess: false, whiteLabel: false, keywordResearch: false, competitorAnalysis: false, schemaGenerator: false, bulkContentGeneration: false, exportFeatures: false },
    },
    {
      name: "Silver", slug: "silver", description: "For creators and freelancers scaling content.",
      monthlyPrice: 29, yearlyPrice: 290, order: 1, isActive: true, isPopular: false,
      features: { aiCreditsPerMonth: 100, maxBlogs: 25, maxTeamMembers: 3, advancedSEO: false, analytics: true, customDomain: false, prioritySupport: false, apiAccess: false, whiteLabel: false, keywordResearch: true, competitorAnalysis: false, schemaGenerator: false, bulkContentGeneration: false, exportFeatures: true },
    },
    {
      name: "Gold", slug: "gold", description: "For growing teams needing advanced SEO capabilities.",
      monthlyPrice: 79, yearlyPrice: 790, order: 2, isActive: true, isPopular: true,
      features: { aiCreditsPerMonth: 500, maxBlogs: 100, maxTeamMembers: 10, advancedSEO: true, analytics: true, customDomain: false, prioritySupport: false, apiAccess: true, whiteLabel: false, keywordResearch: true, competitorAnalysis: true, schemaGenerator: true, bulkContentGeneration: false, exportFeatures: true },
    },
    {
      name: "Diamond", slug: "diamond", description: "For agencies and enterprises needing full access.",
      monthlyPrice: 199, yearlyPrice: 1990, order: 3, isActive: true, isPopular: false,
      features: { aiCreditsPerMonth: 2000, maxBlogs: 999999, maxTeamMembers: 999999, advancedSEO: true, analytics: true, customDomain: true, prioritySupport: true, apiAccess: true, whiteLabel: true, keywordResearch: true, competitorAnalysis: true, schemaGenerator: true, bulkContentGeneration: true, exportFeatures: true },
    },
  ];

  await Plan.insertMany(plans);
  console.log("💳 Created 4 subscription plans\n");

  // ─── Demo Blog Posts ────────────────────────────────────────────────────────
  const blogPosts = [
    {
      title: "10 Proven SEO Strategies That Will Dominate Rankings in 2025",
      slug: "10-proven-seo-strategies-2025",
      excerpt: "Discover the most effective SEO strategies being used by top-ranking websites in 2025. From AI-powered content to Core Web Vitals optimization.",
      content: `<h2>Why SEO Strategies Need to Evolve</h2><p>Search engine optimization has changed dramatically. Google's AI-powered algorithms now prioritize user intent, content depth, and page experience over simple keyword stuffing.</p><h2>1. Focus on Search Intent</h2><p>Understanding <strong>why</strong> someone searches is more important than matching their exact keywords. Align your content with informational, navigational, or transactional intent.</p><h2>2. Create Comprehensive Topic Clusters</h2><p>Instead of isolated blog posts, build interconnected content hubs around core topics. This signals topical authority to search engines.</p><h2>3. Optimize Core Web Vitals</h2><p>Google's ranking factors now heavily include page experience metrics: Largest Contentful Paint (LCP), First Input Delay (FID), and Cumulative Layout Shift (CLS).</p><h2>4. Leverage AI for Content Scaling</h2><p>AI tools like GPT-4 can help you produce high-quality, SEO-optimized content at scale — but always review and personalize AI-generated content.</p><h2>5. Build E-E-A-T Signals</h2><p>Experience, Expertise, Authoritativeness, and Trustworthiness are critical. Add author bios, cite sources, and earn quality backlinks.</p><h2>Conclusion</h2><p>SEO in 2025 requires a holistic approach combining technical excellence, high-quality content, and genuine user value.</p>`,
      tags: ["seo", "digital marketing", "content strategy"],
      categories: ["SEO Guide"],
      status: "published",
      publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      viewCount: 1247,
      readTime: 6,
      isAIGenerated: false,
      authorId: productAdmin._id,
      tenantId: productAdmin._id,
      seo: { metaTitle: "10 Proven SEO Strategies for 2025 | SEO Platform", metaDescription: "Discover 10 battle-tested SEO strategies dominating search rankings in 2025. From AI content to Core Web Vitals.", keywords: ["seo strategies 2025", "seo tips", "google ranking"], seoScore: 87, readabilityScore: 82 },
    },
    {
      title: "The Complete Guide to AI-Powered Content Generation for SEO",
      slug: "ai-powered-content-generation-seo-guide",
      excerpt: "Learn how to harness artificial intelligence to create SEO-optimized content at scale while maintaining quality and authenticity.",
      content: `<h2>The AI Content Revolution</h2><p>Artificial intelligence has fundamentally changed how we approach content creation. Tools powered by large language models can now generate <strong>high-quality, SEO-optimized content</strong> in seconds.</p><h2>Understanding AI Content Generation</h2><p>Modern AI writing tools use transformer-based models trained on billions of web pages. They understand context, tone, and can incorporate semantic SEO principles automatically.</p><h2>How to Use AI for SEO Content</h2><p>The most effective approach combines AI efficiency with human expertise:</p><ul><li>Use AI for initial drafts and outlines</li><li>Add personal insights and original data</li><li>Optimize with your SEO expertise</li><li>Ensure factual accuracy through review</li></ul><h2>Best Practices</h2><p>Always provide AI tools with specific keywords, target audience details, and desired tone. The more context you provide, the better the output.</p><h2>Measuring AI Content Performance</h2><p>Track rankings, organic traffic, and engagement metrics to measure how AI-generated content performs against manually written pieces.</p>`,
      tags: ["ai", "content marketing", "seo"],
      categories: ["AI Tools"],
      status: "published",
      publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      viewCount: 892,
      readTime: 8,
      isAIGenerated: true,
      authorId: productAdmin._id,
      tenantId: productAdmin._id,
      seo: { metaTitle: "AI Content Generation for SEO: Complete Guide 2025", metaDescription: "Master AI-powered content creation for SEO. Learn to generate optimized articles at scale with quality checks.", keywords: ["ai content generation", "ai seo", "content automation"], seoScore: 91, readabilityScore: 88 },
    },
    {
      title: "Keyword Research Mastery: How to Find Low-Competition, High-Traffic Keywords",
      slug: "keyword-research-mastery-guide",
      excerpt: "A step-by-step keyword research framework that uncovers profitable, low-competition keywords your competitors are missing.",
      content: `<h2>Why Most Keyword Research Fails</h2><p>Most SEO beginners target high-volume keywords dominated by authority sites. The real opportunity lies in <strong>long-tail keywords</strong> with lower competition but strong buyer intent.</p><h2>The 4-Step Keyword Research Framework</h2><h3>Step 1: Seed Keyword Generation</h3><p>Start with broad topics related to your niche. Use your product/service as the starting point and expand from there.</p><h3>Step 2: Competitor Gap Analysis</h3><p>Identify keywords your competitors rank for that you don't. These represent immediate opportunities with proven search demand.</p><h3>Step 3: Intent Classification</h3><p>Sort keywords into informational, navigational, commercial, and transactional buckets. Match content format to intent.</p><h3>Step 4: Difficulty vs. Opportunity Scoring</h3><p>Calculate a custom score weighing search volume against difficulty. Prioritize keywords where the opportunity exceeds the challenge.</p><h2>Tools for Keyword Research</h2><p>SEO Platform's AI-powered keyword research tool generates relevant keywords with estimated search volumes, difficulty scores, and CPC data in seconds.</p>`,
      tags: ["keyword research", "seo", "traffic growth"],
      categories: ["SEO Guide"],
      status: "published",
      publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      viewCount: 543,
      readTime: 7,
      isAIGenerated: false,
      authorId: silverUser._id,
      tenantId: silverUser._id,
      seo: { metaTitle: "Keyword Research Mastery: Find Low Competition Keywords", metaDescription: "Step-by-step keyword research framework to find profitable, low-competition keywords with high traffic potential.", keywords: ["keyword research", "low competition keywords", "seo keywords"], seoScore: 84, readabilityScore: 79 },
    },
    {
      title: "Technical SEO Checklist 2025: 50 Points to Audit Your Website",
      slug: "technical-seo-checklist-2025",
      excerpt: "The most comprehensive technical SEO checklist covering site speed, crawlability, schema markup, and Core Web Vitals.",
      content: `<h2>Why Technical SEO Matters</h2><p>Even the best content won't rank if search engines can't crawl and index it properly. Technical SEO forms the foundation of your entire SEO strategy.</p><h2>Crawlability & Indexation</h2><ul><li>Verify robots.txt is not blocking important pages</li><li>Check XML sitemap is current and submitted to Google Search Console</li><li>Fix crawl errors in Google Search Console</li><li>Ensure proper canonical tags on duplicate content</li></ul><h2>Site Speed Optimization</h2><ul><li>Achieve LCP under 2.5 seconds</li><li>Minimize render-blocking resources</li><li>Implement lazy loading for images</li><li>Use a CDN for static assets</li></ul><h2>Mobile Optimization</h2><ul><li>Pass Google's Mobile-Friendly Test</li><li>Ensure tap targets are appropriately sized</li><li>No horizontal scrolling on mobile devices</li></ul><h2>Schema Markup Implementation</h2><p>Implement appropriate structured data for your content type: Article, FAQ, HowTo, Product, or LocalBusiness schema.</p>`,
      tags: ["technical seo", "site audit", "web performance"],
      categories: ["Technical SEO"],
      status: "published",
      publishedAt: new Date(),
      viewCount: 321,
      readTime: 10,
      isAIGenerated: false,
      authorId: productAdmin._id,
      tenantId: productAdmin._id,
      seo: { metaTitle: "Technical SEO Checklist 2025: 50-Point Website Audit", metaDescription: "Comprehensive 50-point technical SEO checklist covering crawlability, site speed, Core Web Vitals and schema markup.", keywords: ["technical seo checklist", "seo audit", "core web vitals"], seoScore: 89, readabilityScore: 85 },
    },
  ];

  await Blog.insertMany(blogPosts);
  console.log(`📝 Created ${blogPosts.length} demo blog posts\n`);

  // ─── CMS Pages ──────────────────────────────────────────────────────────────
  const cmsPages = [
    {
      slug: "home",
      title: "Home — AI-Powered SEO Platform",
      content: "<h1>Welcome to SEO Platform</h1><p>The most powerful AI-driven SEO tool available.</p>",
      isPublished: true,
      seo: { metaTitle: "SEO Platform — AI-Powered SEO & Blog Builder", metaDescription: "Enterprise-grade AI-powered SEO platform. Generate content, research keywords, and optimize rankings." },
    },
    {
      slug: "about",
      title: "About Us",
      content: "<h1>About SEO Platform</h1><p>We're on a mission to democratize SEO by making enterprise-grade tools accessible to every creator, marketer, and business.</p><h2>Our Story</h2><p>Founded in 2024, SEO Platform was born from the frustration of expensive, complicated SEO tools. We believe AI can make powerful SEO accessible to everyone.</p><h2>Our Mission</h2><p>To empower creators and businesses with AI-powered SEO tools that actually work — without the enterprise price tag.</p>",
      isPublished: true,
      seo: { metaTitle: "About SEO Platform", metaDescription: "Learn about our mission to democratize SEO with AI-powered tools." },
    },
    {
      slug: "privacy",
      title: "Privacy Policy",
      content: "<h1>Privacy Policy</h1><p>Last updated: January 2025</p><h2>Information We Collect</h2><p>We collect information you provide directly — name, email, payment information — and usage data to improve our service.</p><h2>How We Use Your Data</h2><p>Your data is used to provide and improve our services, send transactional emails, and process payments. We never sell your data to third parties.</p><h2>Data Security</h2><p>We implement industry-standard encryption and security practices to protect your data.</p><h2>Contact</h2><p>For privacy concerns, email: privacy@seoplatform.com</p>",
      isPublished: true,
      seo: { metaTitle: "Privacy Policy | SEO Platform", metaDescription: "Read our privacy policy to understand how we collect and use your data." },
    },
    {
      slug: "terms",
      title: "Terms of Service",
      content: "<h1>Terms of Service</h1><p>Last updated: January 2025</p><h2>Acceptance of Terms</h2><p>By using SEO Platform, you agree to these terms. If you disagree with any part, you may not use our services.</p><h2>Account Responsibilities</h2><p>You are responsible for maintaining account security and all activities under your account.</p><h2>Acceptable Use</h2><p>You agree not to use our platform to generate spam, misleading content, or content that violates applicable laws.</p><h2>Payments</h2><p>Subscriptions are billed in advance. Refunds are available within 7 days of initial purchase.</p>",
      isPublished: true,
      seo: { metaTitle: "Terms of Service | SEO Platform", metaDescription: "Read our terms of service governing your use of SEO Platform." },
    },
    {
      slug: "contact",
      title: "Contact Us",
      content: "<h1>Contact Us</h1><p>We'd love to hear from you. Send us a message and we'll respond within 24 hours.</p><h2>Support</h2><p>Email: support@seoplatform.com</p><h2>Sales</h2><p>Email: sales@seoplatform.com</p><h2>General Inquiries</h2><p>Email: hello@seoplatform.com</p>",
      isPublished: true,
      seo: { metaTitle: "Contact Us | SEO Platform", metaDescription: "Get in touch with the SEO Platform team." },
    },
  ];

  await CMSPage.insertMany(cmsPages);
  console.log(`📄 Created ${cmsPages.length} CMS pages\n`);

  console.log("✅ Seed completed successfully!\n");
  console.log("─────────────────────────────────────────");
  console.log("🔑 Login credentials:");
  console.log("   Super Admin : superadmin@seoplatform.com / password123");
  console.log("   Product Admin: admin@example.com / password123");
  console.log("   Silver User  : silver@example.com / password123");
  console.log("   Free User    : free@example.com / password123");
  console.log("─────────────────────────────────────────\n");

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  mongoose.disconnect();
  process.exit(1);
});
