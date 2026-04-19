# 🚀 SEO Platform — AI-Powered SaaS

Enterprise-grade AI-powered SEO & Blog Builder built with Next.js 14, MongoDB, OpenAI, Stripe, and Coinbase Commerce.

---

## ✨ Features

- 🤖 **AI Content Generation** — GPT-4o-mini powered blog posts, meta tags, schema markup
- 🔍 **Keyword Research** — AI-powered keyword suggestions with volume, difficulty, CPC
- 📝 **Drag-and-Drop Blog Builder** — Tiptap editor + dnd-kit block builder
- 📊 **SEO Analytics** — Content scoring, readability analysis, internal linking
- 💳 **Stripe + Coinbase** — Monthly/yearly subscriptions + crypto payments
- 👥 **Multi-tenant RBAC** — Super Admin, Product Admin, User roles
- 🌙 **Light/Dark Mode** — Full theme support
- 📧 **Email Notifications** — Nodemailer with Gmail SMTP
- 🔒 **Security** — Rate limiting, JWT sessions, CSRF protection

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 App Router |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Database | MongoDB Atlas + Mongoose |
| Auth | NextAuth.js v4 |
| AI | OpenAI GPT-4o-mini |
| Editor | Tiptap + dnd-kit |
| Payments | Stripe + Coinbase Commerce |
| Storage | Cloudinary + UploadThing |
| State | Zustand |
| Charts | Recharts |
| Email | Nodemailer (Gmail SMTP) |
| Rate Limiting | Upstash Redis |
| Hosting | Vercel |

---

## 🚀 Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env .env.local
```

Fill in all values in `.env.local`. The required ones to get started:
- `MONGODB_URI` — MongoDB Atlas connection string
- `NEXTAUTH_SECRET` — Random string (run: `openssl rand -base64 32`)
- `OPENAI_API_KEY` — From platform.openai.com
- `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` — From Google Cloud Console

### 3. Seed the database

```bash
npm run seed:dev
```

This creates:
- 4 demo users (super admin, product admin, silver, free)
- 4 subscription plans (Free, Silver, Gold, Diamond)
- 4 sample blog posts
- 5 CMS pages (Home, About, Privacy, Terms, Contact)

### 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🔑 Default Credentials (after seeding)

| Role | Email | Password |
|---|---|---|
| Super Admin | superadmin@seoplatform.com | password123 |
| Product Admin | admin@example.com | password123 |
| Silver User | silver@example.com | password123 |
| Free User | free@example.com | password123 |

---

## 📁 Project Structure

```
seo-platform/
├── app/
│   ├── (marketing)/          # Public pages (home, blog, pricing)
│   ├── (auth)/               # Login, Register
│   ├── (dashboard)/
│   │   ├── admin/            # Product admin dashboard
│   │   └── super-admin/      # Super admin dashboard
│   └── api/                  # API routes
├── components/
│   ├── ui/                   # shadcn/ui components
│   ├── layout/               # Sidebar, Navbar
│   ├── blog/                 # TiptapEditor, BlogBlockBuilder
│   ├── dashboard/            # StatsCard
│   ├── seo/                  # SEOScoreCircle
│   └── marketing/            # Navbar, Footer
├── lib/                      # db, auth, utils, ratelimit
├── models/                   # Mongoose models
├── services/                 # AI, Email, Stripe, Coinbase, Cloudinary
├── store/                    # Zustand stores
├── hooks/                    # Custom React hooks
├── types/                    # TypeScript types
└── scripts/                  # Seed script
```

---

## 💳 Stripe Setup

1. Create products in Stripe Dashboard for each plan (Silver, Gold, Diamond)
2. Create monthly and yearly prices for each
3. Add price IDs to `.env.local`:
   ```
   STRIPE_PRICE_SILVER_MONTHLY=price_xxx
   STRIPE_PRICE_SILVER_YEARLY=price_xxx
   STRIPE_PRICE_GOLD_MONTHLY=price_xxx
   STRIPE_PRICE_GOLD_YEARLY=price_xxx
   STRIPE_PRICE_DIAMOND_MONTHLY=price_xxx
   STRIPE_PRICE_DIAMOND_YEARLY=price_xxx
   ```
4. Set up webhook endpoint: `https://yourdomain.com/api/webhooks/stripe`
5. Add webhook secret to `STRIPE_WEBHOOK_SECRET`

---

## 🪙 Coinbase Commerce Setup

1. Create account at commerce.coinbase.com
2. Get API key from Settings
3. Set up webhook endpoint: `https://yourdomain.com/api/webhooks/coinbase`
4. Add to `.env.local`:
   ```
   COINBASE_COMMERCE_API_KEY=xxx
   COINBASE_COMMERCE_WEBHOOK_SECRET=xxx
   ```

---

## 📧 Gmail SMTP Setup

1. Enable 2FA on your Google account
2. Create an App Password at myaccount.google.com/apppasswords
3. Add to `.env.local`:
   ```
   EMAIL_SERVER_USER=your@gmail.com
   EMAIL_SERVER_PASSWORD=your-app-password
   ```

---

## 🚀 Deployment (Vercel)

```bash
npm run build   # Test build locally first
vercel --prod   # Deploy to Vercel
```

Add all environment variables to your Vercel project settings.

---

## 📜 Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run seed:dev` | Seed database with demo data |

---

## 🔐 User Roles

| Role | Access |
|---|---|
| `super_admin` | Full platform control, users, plans, CMS, analytics |
| `product_admin` | Dashboard, blogs, SEO tools, analytics, team, settings |
| `user` | Demo access, view-only |

---

## 📄 License

MIT © SEO Platform
