/**
 * scripts/seed-components.ts
 *
 * Populates MongoDB with 50 production-quality PlanComponents.
 * Run once: npx tsx scripts/seed-components.ts
 *
 * Requirements:
 *   - MONGODB_URI in your .env file
 *   - npx tsx (install: npm install -D tsx)
 *
 * Safe to re-run: uses upsert on `key` field so no duplicates.
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import PlanComponentModel from '../models/PlanComponent';

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) throw new Error('MONGODB_URI missing in .env');

// ─────────────────────────────────────────────────────────────────────────────
// Component definitions
// Each component uses your renderer's {{key}} syntax.
// Theme variables like {{primaryColor}} are injected automatically by renderer.
// ─────────────────────────────────────────────────────────────────────────────

const components = [

    // ═══════════════════════════════════════════════════════════════
    // NAVBARS (8)
    // ═══════════════════════════════════════════════════════════════

    {
        name: 'Navbar — Minimal Light',
        key: 'navbar_minimal_light',
        category: 'navbar',
        description: 'Clean minimal navbar with logo, links, and CTA button.',
        tags: ['minimal', 'light', 'sticky', 'cta'],
        siteTypes: ['all'],
        availableTo: ['free', 'silver', 'gold', 'diamond'],
        isActive: true,
        isFeatured: true,
        propsSchema: [
            {key: 'logoText', label: 'Logo Text', type: 'text', defaultValue: 'MyBrand', group: 'Brand'},
            {key: 'logoUrl', label: 'Logo Image URL', type: 'image', defaultValue: '', group: 'Brand'},
            {key: 'ctaLabel', label: 'CTA Button Label', type: 'text', defaultValue: 'Get Started', group: 'CTA'},
            {key: 'ctaHref', label: 'CTA Link', type: 'url', defaultValue: '#', group: 'CTA'},
            {key: 'bgColor', label: 'Background Color', type: 'color', defaultValue: '#ffffff', group: 'Style'},
            {key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#111827', group: 'Style'},
        ],
        htmlTemplate: `
<nav style="background:{{bgColor}};color:{{textColor}}" class="sticky top-0 z-50 border-b border-gray-100 shadow-sm">
  <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex items-center justify-between h-16">
      <a href="/" class="flex items-center gap-2 font-bold text-xl" style="color:{{textColor}}">
        {{#logoUrl}}<img src="{{logoUrl}}" alt="{{logoText}}" class="h-8 w-auto object-contain"/>{{/logoUrl}}
        {{^logoUrl}}<span>{{logoText}}</span>{{/logoUrl}}
      </a>
      <div class="hidden md:flex items-center gap-8">
        <a href="/" class="text-sm font-medium hover:opacity-70 transition-opacity" style="color:{{textColor}}">Home</a>
        <a href="/about" class="text-sm font-medium hover:opacity-70 transition-opacity" style="color:{{textColor}}">About</a>
        <a href="/blog" class="text-sm font-medium hover:opacity-70 transition-opacity" style="color:{{textColor}}">Blog</a>
        <a href="/contact" class="text-sm font-medium hover:opacity-70 transition-opacity" style="color:{{textColor}}">Contact</a>
      </div>
      <div class="flex items-center gap-3">
        <a href="{{ctaHref}}" class="hidden md:inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90" style="background:{{primaryColor}}">{{ctaLabel}}</a>
        <button class="md:hidden p-2 rounded-lg hover:bg-gray-100" onclick="document.getElementById('mobile-nav').classList.toggle('hidden')" aria-label="Menu">
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
        </button>
      </div>
    </div>
    <div id="mobile-nav" class="hidden md:hidden pb-4 space-y-2">
      <a href="/" class="block px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-100" style="color:{{textColor}}">Home</a>
      <a href="/about" class="block px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-100" style="color:{{textColor}}">About</a>
      <a href="/blog" class="block px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-100" style="color:{{textColor}}">Blog</a>
      <a href="/contact" class="block px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-100" style="color:{{textColor}}">Contact</a>
      <a href="{{ctaHref}}" class="block px-3 py-2 rounded-lg text-sm font-semibold text-white text-center" style="background:{{primaryColor}}">{{ctaLabel}}</a>
    </div>
  </div>
</nav>`,
    },

    {
        name: 'Navbar — Dark Bold',
        key: 'navbar_dark_bold',
        category: 'navbar',
        description: 'Dark background navbar with bold branding.',
        tags: ['dark', 'bold', 'sticky'],
        siteTypes: ['saas', 'agency', 'portfolio'],
        availableTo: ['free', 'silver', 'gold', 'diamond'],
        isActive: true,
        isFeatured: false,
        propsSchema: [
            {key: 'logoText', label: 'Logo Text', type: 'text', defaultValue: 'BRAND', group: 'Brand'},
            {key: 'ctaLabel', label: 'CTA Label', type: 'text', defaultValue: 'Start Free', group: 'CTA'},
            {key: 'ctaHref', label: 'CTA Link', type: 'url', defaultValue: '#', group: 'CTA'},
        ],
        htmlTemplate: `
<nav class="sticky top-0 z-50 bg-gray-950 text-white border-b border-gray-800">
  <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex items-center justify-between h-16">
      <a href="/" class="font-black text-xl tracking-tight text-white">{{logoText}}</a>
      <div class="hidden md:flex items-center gap-6">
        <a href="/" class="text-sm text-gray-300 hover:text-white transition-colors">Home</a>
        <a href="/features" class="text-sm text-gray-300 hover:text-white transition-colors">Features</a>
        <a href="/pricing" class="text-sm text-gray-300 hover:text-white transition-colors">Pricing</a>
        <a href="/blog" class="text-sm text-gray-300 hover:text-white transition-colors">Blog</a>
      </div>
      <div class="flex items-center gap-3">
        <a href="/login" class="text-sm text-gray-300 hover:text-white transition-colors">Log in</a>
        <a href="{{ctaHref}}" class="px-4 py-2 rounded-lg text-sm font-bold text-white transition-opacity hover:opacity-90" style="background:{{primaryColor}}">{{ctaLabel}}</a>
        <button class="md:hidden p-2 rounded hover:bg-gray-800" onclick="document.getElementById('dnav').classList.toggle('hidden')" aria-label="Menu">
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
        </button>
      </div>
    </div>
    <div id="dnav" class="hidden md:hidden pb-4 space-y-1">
      <a href="/" class="block px-3 py-2 rounded text-sm text-gray-300 hover:bg-gray-800 hover:text-white">Home</a>
      <a href="/features" class="block px-3 py-2 rounded text-sm text-gray-300 hover:bg-gray-800 hover:text-white">Features</a>
      <a href="/pricing" class="block px-3 py-2 rounded text-sm text-gray-300 hover:bg-gray-800 hover:text-white">Pricing</a>
      <a href="{{ctaHref}}" class="block px-3 py-2 rounded text-sm font-bold text-white text-center mt-2" style="background:{{primaryColor}}">{{ctaLabel}}</a>
    </div>
  </div>
</nav>`,
    },

    {
        name: 'Navbar — Centered Logo',
        key: 'navbar_centered_logo',
        category: 'navbar',
        description: 'Centered logo with links split left and right.',
        tags: ['centered', 'elegant', 'restaurant', 'portfolio'],
        siteTypes: ['restaurant', 'portfolio'],
        availableTo: ['silver', 'gold', 'diamond'],
        isActive: true,
        propsSchema: [
            {key: 'logoText', label: 'Logo Text', type: 'text', defaultValue: 'LUXE', group: 'Brand'},
            {key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#ffffff', group: 'Style'},
        ],
        htmlTemplate: `
<nav style="background:{{bgColor}}" class="sticky top-0 z-50 border-b border-gray-100">
  <div class="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
    <div class="flex items-center gap-8">
      <a href="/" class="text-sm font-medium text-gray-600 hover:text-gray-900">Menu</a>
      <a href="/about" class="text-sm font-medium text-gray-600 hover:text-gray-900">About</a>
    </div>
    <a href="/" class="font-black text-2xl tracking-widest uppercase" style="color:{{primaryColor}}">{{logoText}}</a>
    <div class="flex items-center gap-8">
      <a href="/gallery" class="text-sm font-medium text-gray-600 hover:text-gray-900">Gallery</a>
      <a href="/contact" class="text-sm font-medium text-gray-600 hover:text-gray-900">Reserve</a>
    </div>
  </div>
</nav>`,
    },

    {
        name: 'Navbar — Transparent Hero',
        key: 'navbar_transparent_hero',
        category: 'navbar',
        description: 'Transparent navbar that overlays a hero section.',
        tags: ['transparent', 'overlay', 'hero'],
        siteTypes: ['portfolio', 'agency', 'restaurant'],
        availableTo: ['silver', 'gold', 'diamond'],
        isActive: true,
        propsSchema: [
            {key: 'logoText', label: 'Logo Text', type: 'text', defaultValue: 'Studio', group: 'Brand'},
            {key: 'ctaLabel', label: 'CTA Label', type: 'text', defaultValue: 'Contact', group: 'CTA'},
            {key: 'ctaHref', label: 'CTA Link', type: 'url', defaultValue: '#contact', group: 'CTA'},
        ],
        htmlTemplate: `
<nav class="absolute top-0 left-0 right-0 z-50 text-white">
  <div class="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
    <a href="/" class="font-bold text-xl text-white">{{logoText}}</a>
    <div class="hidden md:flex items-center gap-8">
      <a href="/" class="text-sm text-white/80 hover:text-white transition-colors">Home</a>
      <a href="/work" class="text-sm text-white/80 hover:text-white transition-colors">Work</a>
      <a href="/about" class="text-sm text-white/80 hover:text-white transition-colors">About</a>
    </div>
    <a href="{{ctaHref}}" class="px-4 py-2 rounded-full border border-white/40 text-sm font-medium text-white hover:bg-white hover:text-gray-900 transition-all">{{ctaLabel}}</a>
  </div>
</nav>`,
    },

    {
        name: 'Navbar — SaaS With Dropdown',
        key: 'navbar_saas_dropdown',
        category: 'navbar',
        description: 'Professional SaaS navbar with product/solutions links.',
        tags: ['saas', 'dropdown', 'professional'],
        siteTypes: ['saas'],
        availableTo: ['gold', 'diamond'],
        isActive: true,
        isFeatured: true,
        propsSchema: [
            {key: 'logoText', label: 'Logo Text', type: 'text', defaultValue: 'AppName', group: 'Brand'},
            {key: 'ctaLabel', label: 'CTA Label', type: 'text', defaultValue: 'Start Free Trial', group: 'CTA'},
            {key: 'ctaHref', label: 'CTA Link', type: 'url', defaultValue: '/signup', group: 'CTA'},
        ],
        htmlTemplate: `
<nav class="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex items-center justify-between h-16">
      <div class="flex items-center gap-8">
        <a href="/" class="font-black text-xl" style="color:{{primaryColor}}">{{logoText}}</a>
        <div class="hidden lg:flex items-center gap-6">
          <a href="/features" class="text-sm font-medium text-gray-600 hover:text-gray-900">Features</a>
          <a href="/pricing" class="text-sm font-medium text-gray-600 hover:text-gray-900">Pricing</a>
          <a href="/docs" class="text-sm font-medium text-gray-600 hover:text-gray-900">Docs</a>
          <a href="/blog" class="text-sm font-medium text-gray-600 hover:text-gray-900">Blog</a>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <a href="/login" class="text-sm font-medium text-gray-600 hover:text-gray-900">Log in</a>
        <a href="{{ctaHref}}" class="px-4 py-2 rounded-lg text-sm font-bold text-white shadow-sm hover:opacity-90 transition-opacity" style="background:{{primaryColor}}">{{ctaLabel}}</a>
      </div>
    </div>
  </div>
</nav>`,
    },

    {
        name: 'Navbar — Ecommerce',
        key: 'navbar_ecommerce',
        category: 'navbar',
        description: 'Store navbar with search, cart icon, and categories.',
        tags: ['ecommerce', 'store', 'shop', 'cart'],
        siteTypes: ['ecommerce'],
        availableTo: ['free', 'silver', 'gold', 'diamond'],
        isActive: true,
        isFeatured: true,
        propsSchema: [
            {key: 'logoText', label: 'Store Name', type: 'text', defaultValue: 'My Store', group: 'Brand'},
            {key: 'logoUrl', label: 'Logo Image', type: 'image', defaultValue: '', group: 'Brand'},
        ],
        htmlTemplate: `
<nav class="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex items-center justify-between h-16 gap-4">
      <a href="/" class="font-bold text-xl shrink-0" style="color:{{primaryColor}}">
        {{#logoUrl}}<img src="{{logoUrl}}" alt="{{logoText}}" class="h-8 w-auto object-contain"/>{{/logoUrl}}
        {{^logoUrl}}{{logoText}}{{/logoUrl}}
      </a>
      <div class="flex-1 max-w-md hidden sm:block">
        <div class="relative">
          <input type="search" placeholder="Search products..." class="w-full h-9 pl-9 pr-4 rounded-full border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:border-transparent" style="--tw-ring-color:{{primaryColor}}"/>
          <svg class="absolute left-3 top-2.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        </div>
      </div>
      <div class="flex items-center gap-4">
        <a href="/account" class="text-sm text-gray-600 hover:text-gray-900 hidden md:block">Account</a>
        <a href="/cart" class="relative p-2 rounded-lg hover:bg-gray-100">
          <svg class="h-5 w-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
          <span class="absolute -top-1 -right-1 h-4 w-4 rounded-full text-white text-xs flex items-center justify-center font-bold" style="background:{{primaryColor}}">0</span>
        </a>
      </div>
    </div>
    <div class="hidden md:flex items-center gap-6 h-10 text-sm">
      <a href="/shop" class="font-medium text-gray-700 hover:text-gray-900">All Products</a>
      <a href="/shop/new" class="text-gray-600 hover:text-gray-900">New Arrivals</a>
      <a href="/shop/sale" class="text-red-600 font-medium hover:text-red-700">Sale</a>
    </div>
  </div>
</nav>`,
    },

    {
        name: 'Navbar — Blog Minimal',
        key: 'navbar_blog_minimal',
        category: 'navbar',
        description: 'Clean blog navbar with publication name and search.',
        tags: ['blog', 'minimal', 'clean'],
        siteTypes: ['blog'],
        availableTo: ['free', 'silver', 'gold', 'diamond'],
        isActive: true,
        propsSchema: [
            {
                key: 'publicationName',
                label: 'Publication Name',
                type: 'text',
                defaultValue: 'The Journal',
                group: 'Brand'
            },
            {key: 'tagline', label: 'Tagline', type: 'text', defaultValue: 'Ideas worth reading', group: 'Brand'},
        ],
        htmlTemplate: `
<header class="bg-white border-b border-gray-100">
  <div class="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
    <div>
      <a href="/" class="font-black text-xl text-gray-900 tracking-tight">{{publicationName}}</a>
      {{#tagline}}<p class="text-xs text-gray-500 mt-0.5">{{tagline}}</p>{{/tagline}}
    </div>
    <nav class="flex items-center gap-6">
      <a href="/blog" class="text-sm font-medium text-gray-600 hover:text-gray-900">Articles</a>
      <a href="/about" class="text-sm font-medium text-gray-600 hover:text-gray-900">About</a>
      <a href="/newsletter" class="px-3 py-1.5 rounded-full text-sm font-semibold text-white" style="background:{{primaryColor}}">Subscribe</a>
    </nav>
  </div>
</header>`,
    },

    {
        name: 'Navbar — Agency Bold',
        key: 'navbar_agency_bold',
        category: 'navbar',
        description: 'Bold agency navbar with services dropdown hint.',
        tags: ['agency', 'bold', 'professional'],
        siteTypes: ['agency'],
        availableTo: ['silver', 'gold', 'diamond'],
        isActive: true,
        propsSchema: [
            {key: 'agencyName', label: 'Agency Name', type: 'text', defaultValue: 'Pixel Agency', group: 'Brand'},
            {key: 'ctaLabel', label: 'CTA Label', type: 'text', defaultValue: 'Work With Us', group: 'CTA'},
            {key: 'ctaHref', label: 'CTA Link', type: 'url', defaultValue: '#contact', group: 'CTA'},
        ],
        htmlTemplate: `
<nav class="sticky top-0 z-50 bg-white border-b-2 border-gray-900">
  <div class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
    <a href="/" class="font-black text-xl uppercase tracking-wider text-gray-900">{{agencyName}}</a>
    <div class="hidden md:flex items-center gap-8">
      <a href="/services" class="text-sm font-semibold text-gray-700 hover:text-gray-900 uppercase tracking-wide">Services</a>
      <a href="/work" class="text-sm font-semibold text-gray-700 hover:text-gray-900 uppercase tracking-wide">Work</a>
      <a href="/about" class="text-sm font-semibold text-gray-700 hover:text-gray-900 uppercase tracking-wide">About</a>
    </div>
    <a href="{{ctaHref}}" class="px-5 py-2 bg-gray-900 text-white text-sm font-bold uppercase tracking-wide hover:bg-gray-700 transition-colors">{{ctaLabel}}</a>
  </div>
</nav>`,
    },

    // ═══════════════════════════════════════════════════════════════
    // HEROES (10)
    // ═══════════════════════════════════════════════════════════════

    {
        name: 'Hero — Bold Gradient',
        key: 'hero_bold_gradient',
        category: 'hero',
        description: 'Full-width hero with gradient background, headline, and dual CTA buttons.',
        tags: ['bold', 'gradient', 'cta', 'saas'],
        siteTypes: ['saas', 'agency'],
        availableTo: ['free', 'silver', 'gold', 'diamond'],
        isActive: true,
        isFeatured: true,
        propsSchema: [
            {
                key: 'headline',
                label: 'Headline',
                type: 'text',
                defaultValue: 'Build something incredible',
                group: 'Content'
            },
            {
                key: 'subheadline',
                label: 'Subheadline',
                type: 'textarea',
                defaultValue: 'The platform that helps you move faster, ship better, and grow your business without the complexity.',
                group: 'Content'
            },
            {
                key: 'primaryCtaLabel',
                label: 'Primary CTA',
                type: 'text',
                defaultValue: 'Get Started Free',
                group: 'CTA'
            },
            {key: 'primaryCtaHref', label: 'Primary CTA Link', type: 'url', defaultValue: '/signup', group: 'CTA'},
            {key: 'secondaryCtaLabel', label: 'Secondary CTA', type: 'text', defaultValue: 'Watch Demo', group: 'CTA'},
            {key: 'secondaryCtaHref', label: 'Secondary CTA Link', type: 'url', defaultValue: '#demo', group: 'CTA'},
            {
                key: 'badgeText',
                label: 'Badge Text',
                type: 'text',
                defaultValue: '🚀 Now in public beta',
                group: 'Content'
            },
        ],
        htmlTemplate: `
<section class="relative overflow-hidden py-24 sm:py-32" style="background:linear-gradient(135deg,{{primaryColor}}15 0%,{{secondaryColor}}15 100%)">
  <div class="absolute inset-0 overflow-hidden pointer-events-none">
    <div class="absolute -top-40 -right-32 w-96 h-96 rounded-full opacity-10" style="background:{{primaryColor}}"></div>
    <div class="absolute -bottom-32 -left-32 w-80 h-80 rounded-full opacity-10" style="background:{{secondaryColor}}"></div>
  </div>
  <div class="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
    {{#badgeText}}
    <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium mb-6" style="background:{{primaryColor}}20;color:{{primaryColor}}">{{badgeText}}</div>
    {{/badgeText}}
    <h1 class="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight text-gray-900 mb-6 leading-tight">{{headline}}</h1>
    <p class="text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">{{subheadline}}</p>
    <div class="flex flex-col sm:flex-row gap-4 justify-center">
      <a href="{{primaryCtaHref}}" class="inline-flex items-center justify-center px-8 py-4 rounded-xl text-white font-bold text-lg shadow-lg hover:opacity-90 transition-opacity" style="background:{{primaryColor}}">{{primaryCtaLabel}}</a>
      {{#secondaryCtaLabel}}<a href="{{secondaryCtaHref}}" class="inline-flex items-center justify-center px-8 py-4 rounded-xl text-gray-700 font-bold text-lg border-2 border-gray-200 hover:border-gray-300 bg-white transition-colors">{{secondaryCtaLabel}}</a>{{/secondaryCtaLabel}}
    </div>
  </div>
</section>`,
    },

    {
        name: 'Hero — Split Image',
        key: 'hero_split_image',
        category: 'hero',
        description: 'Left text, right image hero layout.',
        tags: ['split', 'image', 'modern'],
        siteTypes: ['saas', 'agency', 'portfolio'],
        availableTo: ['free', 'silver', 'gold', 'diamond'],
        isActive: true,
        isFeatured: true,
        propsSchema: [
            {
                key: 'headline',
                label: 'Headline',
                type: 'text',
                defaultValue: 'The smarter way to work',
                group: 'Content'
            },
            {
                key: 'description',
                label: 'Description',
                type: 'textarea',
                defaultValue: 'Streamline your workflow with powerful tools designed for modern teams. Start in minutes, scale without limits.',
                group: 'Content'
            },
            {key: 'ctaLabel', label: 'CTA Label', type: 'text', defaultValue: 'Start Building', group: 'CTA'},
            {key: 'ctaHref', label: 'CTA Link', type: 'url', defaultValue: '#', group: 'CTA'},
            {
                key: 'heroImage',
                label: 'Hero Image URL',
                type: 'image',
                defaultValue: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&q=80',
                group: 'Media'
            },
            {
                key: 'imageAlt',
                label: 'Image Alt Text',
                type: 'text',
                defaultValue: 'Product screenshot',
                group: 'Media'
            },
        ],
        htmlTemplate: `
<section class="py-16 sm:py-24 bg-white">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
      <div>
        <h1 class="text-4xl sm:text-5xl font-black text-gray-900 leading-tight mb-6">{{headline}}</h1>
        <p class="text-lg text-gray-600 leading-relaxed mb-8">{{description}}</p>
        <div class="flex flex-col sm:flex-row gap-3">
          <a href="{{ctaHref}}" class="inline-flex items-center justify-center px-6 py-3 rounded-xl text-white font-bold shadow-md hover:opacity-90 transition-opacity" style="background:{{primaryColor}}">{{ctaLabel}}</a>
          <a href="#learn-more" class="inline-flex items-center justify-center px-6 py-3 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition-colors">Learn more →</a>
        </div>
      </div>
      <div class="relative">
        <div class="absolute inset-0 rounded-2xl rotate-3 opacity-20" style="background:{{primaryColor}}"></div>
        <img src="{{heroImage}}" alt="{{imageAlt}}" class="relative rounded-2xl shadow-2xl w-full object-cover aspect-video"/>
      </div>
    </div>
  </div>
</section>`,
    },

    {
        name: 'Hero — Fullscreen Video',
        key: 'hero_fullscreen',
        category: 'hero',
        description: 'Full-viewport hero with background color/pattern and centered CTA.',
        tags: ['fullscreen', 'centered', 'minimal'],
        siteTypes: ['portfolio', 'agency', 'restaurant'],
        availableTo: ['silver', 'gold', 'diamond'],
        isActive: true,
        propsSchema: [
            {
                key: 'headline',
                label: 'Headline',
                type: 'text',
                defaultValue: 'We craft digital experiences',
                group: 'Content'
            },
            {
                key: 'subtext',
                label: 'Subtext',
                type: 'text',
                defaultValue: 'Award-winning design studio',
                group: 'Content'
            },
            {key: 'ctaLabel', label: 'CTA', type: 'text', defaultValue: 'See Our Work', group: 'CTA'},
            {key: 'ctaHref', label: 'CTA Link', type: 'url', defaultValue: '#work', group: 'CTA'},
            {key: 'bgColor', label: 'Background Color', type: 'color', defaultValue: '#0f0f0f', group: 'Style'},
        ],
        htmlTemplate: `
<section class="min-h-screen flex flex-col items-center justify-center text-center px-4 relative overflow-hidden" style="background:{{bgColor}}">
  <div class="relative z-10">
    <p class="text-sm font-semibold uppercase tracking-widest mb-4 opacity-60 text-white">{{subtext}}</p>
    <h1 class="text-5xl sm:text-7xl lg:text-8xl font-black leading-none mb-8 text-white">{{headline}}</h1>
    <a href="{{ctaHref}}" class="inline-flex items-center gap-2 px-8 py-4 rounded-full border-2 border-white text-white font-bold hover:bg-white hover:text-gray-900 transition-all text-lg">{{ctaLabel}} <span>→</span></a>
  </div>
</section>`,
    },

    {
        name: 'Hero — Blog Header',
        key: 'hero_blog_header',
        category: 'hero',
        description: 'Publication-style blog hero with large title and category tags.',
        tags: ['blog', 'publication', 'editorial'],
        siteTypes: ['blog'],
        availableTo: ['free', 'silver', 'gold', 'diamond'],
        isActive: true,
        propsSchema: [
            {
                key: 'publicationTitle',
                label: 'Publication Title',
                type: 'text',
                defaultValue: 'The Daily Read',
                group: 'Content'
            },
            {
                key: 'tagline',
                label: 'Tagline',
                type: 'text',
                defaultValue: 'Thoughtful writing on technology, design, and culture',
                group: 'Content'
            },
        ],
        htmlTemplate: `
<section class="py-16 bg-white border-b border-gray-100">
  <div class="max-w-4xl mx-auto px-4 text-center">
    <h1 class="text-6xl sm:text-7xl font-black tracking-tight mb-4" style="color:{{primaryColor}}">{{publicationTitle}}</h1>
    <p class="text-lg text-gray-500 max-w-xl mx-auto">{{tagline}}</p>
    <div class="mt-8 flex items-center justify-center gap-3 flex-wrap">
      <a href="/blog/technology" class="px-4 py-2 rounded-full border border-gray-200 text-sm font-medium text-gray-700 hover:border-gray-400 transition-colors">Technology</a>
      <a href="/blog/design" class="px-4 py-2 rounded-full border border-gray-200 text-sm font-medium text-gray-700 hover:border-gray-400 transition-colors">Design</a>
      <a href="/blog/culture" class="px-4 py-2 rounded-full border border-gray-200 text-sm font-medium text-gray-700 hover:border-gray-400 transition-colors">Culture</a>
      <a href="/blog/business" class="px-4 py-2 rounded-full border border-gray-200 text-sm font-medium text-gray-700 hover:border-gray-400 transition-colors">Business</a>
    </div>
  </div>
</section>`,
    },

    {
        name: 'Hero — Ecommerce Banner',
        key: 'hero_ecommerce_banner',
        category: 'hero',
        description: 'Store hero with promotion banner, shop CTA, and product image.',
        tags: ['ecommerce', 'store', 'promo', 'sale'],
        siteTypes: ['ecommerce'],
        availableTo: ['free', 'silver', 'gold', 'diamond'],
        isActive: true,
        isFeatured: true,
        propsSchema: [
            {key: 'headline', label: 'Headline', type: 'text', defaultValue: 'New Season Collection', group: 'Content'},
            {
                key: 'subheadline',
                label: 'Subheadline',
                type: 'text',
                defaultValue: 'Discover pieces made to last',
                group: 'Content'
            },
            {key: 'badgeText', label: 'Promo Badge', type: 'text', defaultValue: 'Up to 40% off', group: 'Content'},
            {key: 'ctaLabel', label: 'Shop CTA', type: 'text', defaultValue: 'Shop Now', group: 'CTA'},
            {key: 'ctaHref', label: 'Shop Link', type: 'url', defaultValue: '/shop', group: 'CTA'},
            {
                key: 'heroImage',
                label: 'Hero Image',
                type: 'image',
                defaultValue: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=900&q=80',
                group: 'Media'
            },
        ],
        htmlTemplate: `
<section class="relative overflow-hidden bg-gray-50">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-0 min-h-[500px] items-center">
      <div class="py-16 lg:py-24 pr-0 lg:pr-12">
        {{#badgeText}}
        <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold mb-4 text-white" style="background:{{accentColor}}">{{badgeText}}</span>
        {{/badgeText}}
        <h1 class="text-4xl sm:text-5xl font-black text-gray-900 leading-tight mb-4">{{headline}}</h1>
        <p class="text-lg text-gray-600 mb-8">{{subheadline}}</p>
        <a href="{{ctaHref}}" class="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-white font-bold text-lg shadow-md hover:opacity-90 transition-opacity" style="background:{{primaryColor}}">{{ctaLabel}} →</a>
      </div>
      <div class="relative h-64 lg:h-full min-h-[300px]">
        <img src="{{heroImage}}" alt="{{headline}}" class="w-full h-full object-cover"/>
      </div>
    </div>
  </div>
</section>`,
    },

    {
        name: 'Hero — Restaurant',
        key: 'hero_restaurant',
        category: 'hero',
        description: 'Atmospheric restaurant hero with reservation CTA.',
        tags: ['restaurant', 'food', 'atmospheric'],
        siteTypes: ['restaurant'],
        availableTo: ['free', 'silver', 'gold', 'diamond'],
        isActive: true,
        isFeatured: true,
        propsSchema: [
            {
                key: 'restaurantName',
                label: 'Restaurant Name',
                type: 'text',
                defaultValue: 'La Bella Vita',
                group: 'Content'
            },
            {
                key: 'tagline',
                label: 'Tagline',
                type: 'text',
                defaultValue: 'Authentic Italian cuisine in the heart of the city',
                group: 'Content'
            },
            {
                key: 'bgImage',
                label: 'Background Image',
                type: 'image',
                defaultValue: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1400&q=80',
                group: 'Media'
            },
            {key: 'reserveHref', label: 'Reservation Link', type: 'url', defaultValue: '#reserve', group: 'CTA'},
            {key: 'menuHref', label: 'Menu Link', type: 'url', defaultValue: '#menu', group: 'CTA'},
        ],
        htmlTemplate: `
<section class="relative min-h-screen flex items-center justify-center overflow-hidden">
  <div class="absolute inset-0">
    <img src="{{bgImage}}" alt="{{restaurantName}}" class="w-full h-full object-cover"/>
    <div class="absolute inset-0 bg-black/55"></div>
  </div>
  <div class="relative z-10 text-center text-white px-4 max-w-3xl mx-auto">
    <p class="text-sm font-medium uppercase tracking-widest mb-4 text-white/70">Welcome to</p>
    <h1 class="text-6xl sm:text-7xl font-black mb-6 leading-tight">{{restaurantName}}</h1>
    <p class="text-xl text-white/80 mb-10 leading-relaxed">{{tagline}}</p>
    <div class="flex flex-col sm:flex-row gap-4 justify-center">
      <a href="{{reserveHref}}" class="px-8 py-4 rounded-lg font-bold text-white text-lg shadow-lg hover:opacity-90 transition-opacity" style="background:{{primaryColor}}">Reserve a Table</a>
      <a href="{{menuHref}}" class="px-8 py-4 rounded-lg font-bold text-white text-lg border-2 border-white/50 hover:bg-white/10 transition-colors">View Menu</a>
    </div>
  </div>
</section>`,
    },

    {
        name: 'Hero — Portfolio',
        key: 'hero_portfolio',
        category: 'hero',
        description: 'Personal portfolio hero with name, title, and availability badge.',
        tags: ['portfolio', 'personal', 'freelancer'],
        siteTypes: ['portfolio'],
        availableTo: ['free', 'silver', 'gold', 'diamond'],
        isActive: true,
        propsSchema: [
            {key: 'name', label: 'Your Name', type: 'text', defaultValue: 'Alex Johnson', group: 'Content'},
            {
                key: 'title',
                label: 'Job Title',
                type: 'text',
                defaultValue: 'Product Designer & Developer',
                group: 'Content'
            },
            {
                key: 'bio',
                label: 'Short Bio',
                type: 'textarea',
                defaultValue: 'I help startups and growing companies craft exceptional digital experiences. Currently available for freelance work.',
                group: 'Content'
            },
            {key: 'available', label: 'Show Availability Badge', type: 'boolean', defaultValue: true, group: 'Content'},
            {key: 'ctaLabel', label: 'CTA Label', type: 'text', defaultValue: 'View My Work', group: 'CTA'},
            {key: 'ctaHref', label: 'CTA Link', type: 'url', defaultValue: '#work', group: 'CTA'},
            {key: 'avatarUrl', label: 'Avatar Image', type: 'image', defaultValue: '', group: 'Media'},
        ],
        htmlTemplate: `
<section class="py-20 sm:py-32 bg-white">
  <div class="max-w-4xl mx-auto px-4 sm:px-6">
    <div class="flex flex-col md:flex-row gap-10 items-start md:items-center">
      {{#avatarUrl}}
      <div class="shrink-0">
        <img src="{{avatarUrl}}" alt="{{name}}" class="w-28 h-28 rounded-2xl object-cover shadow-lg"/>
      </div>
      {{/avatarUrl}}
      <div>
        {{#available}}
        <div class="flex items-center gap-2 mb-4">
          <span class="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span class="text-sm font-medium text-emerald-600">Available for work</span>
        </div>
        {{/available}}
        <h1 class="text-4xl sm:text-5xl font-black text-gray-900 mb-2">{{name}}</h1>
        <p class="text-xl font-medium mb-4" style="color:{{primaryColor}}">{{title}}</p>
        <p class="text-gray-600 leading-relaxed max-w-xl mb-8">{{bio}}</p>
        <div class="flex flex-wrap gap-3">
          <a href="{{ctaHref}}" class="px-6 py-3 rounded-xl text-white font-bold hover:opacity-90 transition-opacity" style="background:{{primaryColor}}">{{ctaLabel}}</a>
          <a href="#contact" class="px-6 py-3 rounded-xl text-gray-700 font-bold border border-gray-200 hover:border-gray-300 transition-colors">Get in Touch</a>
        </div>
      </div>
    </div>
  </div>
</section>`,
    },

    {
        name: 'Hero — Minimal Centered',
        key: 'hero_minimal_centered',
        category: 'hero',
        description: 'Clean minimal centered hero, suitable for any site type.',
        tags: ['minimal', 'centered', 'clean'],
        siteTypes: ['all'],
        availableTo: ['free', 'silver', 'gold', 'diamond'],
        isActive: true,
        propsSchema: [
            {
                key: 'headline',
                label: 'Headline',
                type: 'text',
                defaultValue: 'Something worth your attention',
                group: 'Content'
            },
            {
                key: 'description',
                label: 'Description',
                type: 'textarea',
                defaultValue: 'A clear and compelling value proposition goes here. Keep it short, honest, and focused on what you offer.',
                group: 'Content'
            },
            {key: 'ctaLabel', label: 'CTA', type: 'text', defaultValue: 'Get Started', group: 'CTA'},
            {key: 'ctaHref', label: 'CTA Link', type: 'url', defaultValue: '#', group: 'CTA'},
        ],
        htmlTemplate: `
<section class="py-24 sm:py-36 bg-white">
  <div class="max-w-3xl mx-auto px-4 text-center">
    <h1 class="text-5xl sm:text-6xl font-black text-gray-900 leading-tight mb-6">{{headline}}</h1>
    <p class="text-xl text-gray-500 leading-relaxed mb-10">{{description}}</p>
    <a href="{{ctaHref}}" class="inline-flex items-center px-8 py-4 rounded-xl text-white font-bold text-lg shadow-lg hover:opacity-90 transition-opacity" style="background:{{primaryColor}}">{{ctaLabel}}</a>
  </div>
</section>`,
    },

    {
        name: 'Hero — Stats Banner',
        key: 'hero_stats_banner',
        category: 'hero',
        description: 'Hero with headline and three social proof stats below.',
        tags: ['stats', 'social-proof', 'saas'],
        siteTypes: ['saas', 'agency'],
        availableTo: ['silver', 'gold', 'diamond'],
        isActive: true,
        propsSchema: [
            {
                key: 'headline',
                label: 'Headline',
                type: 'text',
                defaultValue: 'Trusted by 10,000+ teams worldwide',
                group: 'Content'
            },
            {
                key: 'description',
                label: 'Description',
                type: 'textarea',
                defaultValue: 'Join thousands of companies who use our platform to build, launch, and grow.',
                group: 'Content'
            },
            {key: 'stat1Value', label: 'Stat 1 Value', type: 'text', defaultValue: '10K+', group: 'Stats'},
            {key: 'stat1Label', label: 'Stat 1 Label', type: 'text', defaultValue: 'Active users', group: 'Stats'},
            {key: 'stat2Value', label: 'Stat 2 Value', type: 'text', defaultValue: '99.9%', group: 'Stats'},
            {key: 'stat2Label', label: 'Stat 2 Label', type: 'text', defaultValue: 'Uptime SLA', group: 'Stats'},
            {key: 'stat3Value', label: 'Stat 3 Value', type: 'text', defaultValue: '4.9★', group: 'Stats'},
            {key: 'stat3Label', label: 'Stat 3 Label', type: 'text', defaultValue: 'Average rating', group: 'Stats'},
            {key: 'ctaLabel', label: 'CTA', type: 'text', defaultValue: 'Start Free', group: 'CTA'},
            {key: 'ctaHref', label: 'CTA Link', type: 'url', defaultValue: '/signup', group: 'CTA'},
        ],
        htmlTemplate: `
<section class="py-20 sm:py-28 bg-white">
  <div class="max-w-4xl mx-auto px-4 text-center">
    <h1 class="text-5xl sm:text-6xl font-black text-gray-900 leading-tight mb-6">{{headline}}</h1>
    <p class="text-xl text-gray-500 mb-10 max-w-2xl mx-auto">{{description}}</p>
    <a href="{{ctaHref}}" class="inline-flex items-center px-8 py-4 rounded-xl text-white font-bold text-lg shadow-lg hover:opacity-90 transition-opacity mb-14" style="background:{{primaryColor}}">{{ctaLabel}}</a>
    <div class="grid grid-cols-3 gap-8 pt-10 border-t border-gray-100">
      <div>
        <div class="text-4xl font-black text-gray-900 mb-1">{{stat1Value}}</div>
        <div class="text-sm text-gray-500">{{stat1Label}}</div>
      </div>
      <div>
        <div class="text-4xl font-black text-gray-900 mb-1">{{stat2Value}}</div>
        <div class="text-sm text-gray-500">{{stat2Label}}</div>
      </div>
      <div>
        <div class="text-4xl font-black text-gray-900 mb-1">{{stat3Value}}</div>
        <div class="text-sm text-gray-500">{{stat3Label}}</div>
      </div>
    </div>
  </div>
</section>`,
    },

    // ═══════════════════════════════════════════════════════════════
    // SECTIONS (10)
    // ═══════════════════════════════════════════════════════════════

    {
        name: 'Section — Features Grid',
        key: 'section_features_grid',
        category: 'section',
        description: 'Three-column features grid with icons and descriptions.',
        tags: ['features', 'grid', 'icons'],
        siteTypes: ['saas', 'agency', 'all'],
        availableTo: ['free', 'silver', 'gold', 'diamond'],
        isActive: true,
        isFeatured: true,
        propsSchema: [
            {
                key: 'sectionTitle',
                label: 'Section Title',
                type: 'text',
                defaultValue: 'Everything you need',
                group: 'Content'
            },
            {
                key: 'sectionSubtitle',
                label: 'Section Subtitle',
                type: 'text',
                defaultValue: 'Powerful features to help your team move faster',
                group: 'Content'
            },
            {
                key: 'features', label: 'Features', type: 'array', defaultValue: [
                    {
                        icon: '⚡',
                        title: 'Lightning Fast',
                        description: 'Built for performance from the ground up. Pages load in milliseconds.'
                    },
                    {
                        icon: '🔒',
                        title: 'Secure by Default',
                        description: 'Enterprise-grade security with end-to-end encryption and SSO.'
                    },
                    {
                        icon: '📊',
                        title: 'Powerful Analytics',
                        description: 'Deep insights into your data with real-time dashboards and reports.'
                    },
                    {
                        icon: '🤝',
                        title: 'Team Collaboration',
                        description: 'Work together seamlessly with live cursors, comments, and history.'
                    },
                    {
                        icon: '🔌',
                        title: '100+ Integrations',
                        description: 'Connect with the tools you already use. Zapier, Slack, and more.'
                    },
                    {
                        icon: '📱',
                        title: 'Mobile First',
                        description: 'Designed for mobile from day one. Looks great on every screen.'
                    },
                ], group: 'Content', arrayItemSchema: [
                    {key: 'icon', label: 'Emoji Icon', type: 'text', defaultValue: '✨'},
                    {key: 'title', label: 'Feature Title', type: 'text', defaultValue: 'Feature'},
                    {
                        key: 'description',
                        label: 'Description',
                        type: 'textarea',
                        defaultValue: 'Short description of this feature.'
                    },
                ]
            },
        ],
        htmlTemplate: `
<section class="py-20 bg-white">
  <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center mb-16">
      <h2 class="text-4xl font-black text-gray-900 mb-4">{{sectionTitle}}</h2>
      <p class="text-xl text-gray-500 max-w-2xl mx-auto">{{sectionSubtitle}}</p>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {{#features}}
      <div class="p-6 rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all">
        <div class="text-3xl mb-4">{{icon}}</div>
        <h3 class="text-lg font-bold text-gray-900 mb-2">{{title}}</h3>
        <p class="text-gray-500 leading-relaxed text-sm">{{description}}</p>
      </div>
      {{/features}}
    </div>
  </div>
</section>`,
    },

    {
        name: 'Section — Testimonials',
        key: 'section_testimonials',
        category: 'section',
        description: 'Three customer testimonials in a grid layout.',
        tags: ['testimonials', 'social-proof', 'reviews'],
        siteTypes: ['all'],
        availableTo: ['free', 'silver', 'gold', 'diamond'],
        isActive: true,
        isFeatured: true,
        propsSchema: [
            {
                key: 'sectionTitle',
                label: 'Section Title',
                type: 'text',
                defaultValue: 'Loved by thousands',
                group: 'Content'
            },
            {
                key: 'testimonials', label: 'Testimonials', type: 'array', defaultValue: [
                    {
                        quote: 'This is the best product I\'ve ever used. It completely transformed how our team works.',
                        name: 'Sarah K.',
                        role: 'CEO at TechCorp',
                        avatar: ''
                    },
                    {
                        quote: 'The setup took 5 minutes and we were seeing results within hours. Highly recommend.',
                        name: 'Marcus T.',
                        role: 'Head of Growth',
                        avatar: ''
                    },
                    {
                        quote: 'Incredible support team and the product just keeps getting better. We\'re customers for life.',
                        name: 'Priya M.',
                        role: 'Founder at StartupXYZ',
                        avatar: ''
                    },
                ], group: 'Content', arrayItemSchema: [
                    {key: 'quote', label: 'Quote', type: 'textarea', defaultValue: 'This product is amazing.'},
                    {key: 'name', label: 'Name', type: 'text', defaultValue: 'Customer Name'},
                    {key: 'role', label: 'Role', type: 'text', defaultValue: 'Position at Company'},
                    {key: 'avatar', label: 'Avatar URL', type: 'image', defaultValue: ''},
                ]
            },
        ],
        htmlTemplate: `
<section class="py-20" style="background:{{primaryColor}}08">
  <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
    <h2 class="text-4xl font-black text-gray-900 text-center mb-12">{{sectionTitle}}</h2>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      {{#testimonials}}
      <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div class="flex mb-4">
          <span class="text-yellow-400">★★★★★</span>
        </div>
        <p class="text-gray-700 leading-relaxed mb-6 italic">"{{quote}}"</p>
        <div class="flex items-center gap-3">
          {{#avatar}}
          <img src="{{avatar}}" alt="{{name}}" class="w-10 h-10 rounded-full object-cover"/>
          {{/avatar}}
          {{^avatar}}
          <div class="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm" style="background:{{primaryColor}}">{{name}}</div>
          {{/avatar}}
          <div>
            <p class="font-semibold text-gray-900 text-sm">{{name}}</p>
            <p class="text-gray-500 text-xs">{{role}}</p>
          </div>
        </div>
      </div>
      {{/testimonials}}
    </div>
  </div>
</section>`,
    },

    {
        name: 'Section — Pricing Table',
        key: 'section_pricing',
        category: 'section',
        description: 'Three-tier pricing table with feature lists.',
        tags: ['pricing', 'plans', 'tiers'],
        siteTypes: ['saas'],
        availableTo: ['silver', 'gold', 'diamond'],
        isActive: true,
        isFeatured: true,
        propsSchema: [
            {
                key: 'sectionTitle',
                label: 'Section Title',
                type: 'text',
                defaultValue: 'Simple, transparent pricing',
                group: 'Content'
            },
            {key: 'plan1Name', label: 'Plan 1 Name', type: 'text', defaultValue: 'Starter', group: 'Plan 1'},
            {key: 'plan1Price', label: 'Plan 1 Price', type: 'text', defaultValue: '$9', group: 'Plan 1'},
            {
                key: 'plan1Features',
                label: 'Plan 1 Features (one per line)',
                type: 'textarea',
                defaultValue: '5 projects\n10GB storage\nEmail support\nAPI access',
                group: 'Plan 1'
            },
            {key: 'plan2Name', label: 'Plan 2 Name', type: 'text', defaultValue: 'Pro', group: 'Plan 2'},
            {key: 'plan2Price', label: 'Plan 2 Price', type: 'text', defaultValue: '$29', group: 'Plan 2'},
            {
                key: 'plan2Features',
                label: 'Plan 2 Features (one per line)',
                type: 'textarea',
                defaultValue: 'Unlimited projects\n100GB storage\nPriority support\nAdvanced analytics\nCustom domain',
                group: 'Plan 2'
            },
            {key: 'plan3Name', label: 'Plan 3 Name', type: 'text', defaultValue: 'Enterprise', group: 'Plan 3'},
            {key: 'plan3Price', label: 'Plan 3 Price', type: 'text', defaultValue: 'Custom', group: 'Plan 3'},
            {
                key: 'plan3Features',
                label: 'Plan 3 Features (one per line)',
                type: 'textarea',
                defaultValue: 'Everything in Pro\nSSO & SAML\nSLA guarantee\nDedicated manager\nCustom integrations',
                group: 'Plan 3'
            },
            {key: 'ctaHref', label: 'CTA Base Link', type: 'url', defaultValue: '/signup', group: 'CTA'},
        ],
        htmlTemplate: `
<section class="py-20 bg-white" id="pricing">
  <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
    <h2 class="text-4xl font-black text-gray-900 text-center mb-12">{{sectionTitle}}</h2>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="rounded-2xl border-2 border-gray-100 p-6">
        <p class="font-bold text-gray-900 text-lg mb-1">{{plan1Name}}</p>
        <p class="text-4xl font-black text-gray-900 mb-1">{{plan1Price}}<span class="text-base font-normal text-gray-500">/mo</span></p>
        <hr class="my-4 border-gray-100"/>
        <ul class="space-y-3 text-sm text-gray-600 mb-6" id="p1-features">
          <li class="flex items-center gap-2">✓ 5 projects</li>
        </ul>
        <a href="{{ctaHref}}?plan=starter" class="block text-center py-3 rounded-xl border-2 border-gray-200 font-bold text-gray-700 hover:border-gray-400 transition-colors">Get started</a>
      </div>
      <div class="rounded-2xl border-2 p-6 relative shadow-lg" style="border-color:{{primaryColor}}">
        <div class="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold text-white" style="background:{{primaryColor}}">Most Popular</div>
        <p class="font-bold text-gray-900 text-lg mb-1">{{plan2Name}}</p>
        <p class="text-4xl font-black text-gray-900 mb-1">{{plan2Price}}<span class="text-base font-normal text-gray-500">/mo</span></p>
        <hr class="my-4 border-gray-100"/>
        <ul class="space-y-3 text-sm text-gray-600 mb-6">
          <li class="flex items-center gap-2">✓ Unlimited projects</li>
        </ul>
        <a href="{{ctaHref}}?plan=pro" class="block text-center py-3 rounded-xl font-bold text-white hover:opacity-90 transition-opacity" style="background:{{primaryColor}}">Get started</a>
      </div>
      <div class="rounded-2xl border-2 border-gray-100 p-6 bg-gray-950 text-white">
        <p class="font-bold text-lg mb-1">{{plan3Name}}</p>
        <p class="text-4xl font-black mb-1">{{plan3Price}}</p>
        <hr class="my-4 border-gray-700"/>
        <ul class="space-y-3 text-sm text-gray-300 mb-6">
          <li class="flex items-center gap-2">✓ Everything in Pro</li>
        </ul>
        <a href="/contact?subject=enterprise" class="block text-center py-3 rounded-xl border-2 border-gray-600 font-bold text-white hover:border-gray-400 transition-colors">Contact sales</a>
      </div>
    </div>
  </div>
</section>`,
    },

    {
        name: 'Section — About / Story',
        key: 'section_about',
        category: 'section',
        description: 'Company story section with image and text.',
        tags: ['about', 'story', 'team'],
        siteTypes: ['all'],
        availableTo: ['free', 'silver', 'gold', 'diamond'],
        isActive: true,
        propsSchema: [
            {key: 'sectionTitle', label: 'Title', type: 'text', defaultValue: 'Our story', group: 'Content'},
            {
                key: 'paragraph1',
                label: 'Paragraph 1',
                type: 'textarea',
                defaultValue: 'We started with a simple belief: that great tools should be accessible to everyone, not just large enterprises with big budgets.',
                group: 'Content'
            },
            {
                key: 'paragraph2',
                label: 'Paragraph 2',
                type: 'textarea',
                defaultValue: 'Today we serve thousands of teams around the world, from solo founders to Fortune 500 companies. Our mission hasn\'t changed.',
                group: 'Content'
            },
            {
                key: 'image',
                label: 'Image URL',
                type: 'image',
                defaultValue: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=700&q=80',
                group: 'Media'
            },
            {key: 'imageAlt', label: 'Image Alt Text', type: 'text', defaultValue: 'Our team', group: 'Media'},
        ],
        htmlTemplate: `
<section class="py-20 bg-white">
  <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
      <div>
        <h2 class="text-4xl font-black text-gray-900 mb-6">{{sectionTitle}}</h2>
        <p class="text-gray-600 text-lg leading-relaxed mb-4">{{paragraph1}}</p>
        <p class="text-gray-600 text-lg leading-relaxed">{{paragraph2}}</p>
      </div>
      <div class="relative">
        <div class="absolute -inset-4 rounded-3xl opacity-10 rotate-2" style="background:{{primaryColor}}"></div>
        <img src="{{image}}" alt="{{imageAlt}}" class="relative rounded-2xl shadow-xl w-full object-cover aspect-[4/3]"/>
      </div>
    </div>
  </div>
</section>`,
    },

    {
        name: 'Section — FAQ Accordion',
        key: 'section_faq',
        category: 'section',
        description: 'Expandable FAQ section with accordion interaction.',
        tags: ['faq', 'accordion', 'support'],
        siteTypes: ['all'],
        availableTo: ['free', 'silver', 'gold', 'diamond'],
        isActive: true,
        propsSchema: [
            {
                key: 'sectionTitle',
                label: 'Section Title',
                type: 'text',
                defaultValue: 'Frequently asked questions',
                group: 'Content'
            },
            {
                key: 'faqs', label: 'FAQ Items', type: 'array', defaultValue: [
                    {
                        question: 'How do I get started?',
                        answer: 'Sign up for a free account and follow our quick setup guide. You\'ll be up and running in under 5 minutes.'
                    },
                    {
                        question: 'Is there a free plan?',
                        answer: 'Yes! Our free plan includes all core features with a limit of 5 projects. No credit card required.'
                    },
                    {
                        question: 'Can I cancel anytime?',
                        answer: 'Absolutely. Cancel your subscription anytime from your account settings. No questions asked.'
                    },
                    {
                        question: 'Do you offer refunds?',
                        answer: 'We offer a 30-day money-back guarantee on all paid plans. Just contact support and we\'ll sort it out.'
                    },
                ], group: 'Content', arrayItemSchema: [
                    {key: 'question', label: 'Question', type: 'text', defaultValue: 'Question?'},
                    {key: 'answer', label: 'Answer', type: 'textarea', defaultValue: 'Answer here.'},
                ]
            },
        ],
        jsCode: `
document.querySelectorAll('.faq-question').forEach(function(btn) {
  btn.addEventListener('click', function() {
    var answer = this.nextElementSibling;
    var icon = this.querySelector('.faq-icon');
    var isOpen = answer.style.maxHeight && answer.style.maxHeight !== '0px';
    document.querySelectorAll('.faq-answer').forEach(function(a) { a.style.maxHeight = '0px'; a.style.padding = '0'; });
    document.querySelectorAll('.faq-icon').forEach(function(i) { i.textContent = '+'; });
    if (!isOpen) {
      answer.style.maxHeight = answer.scrollHeight + 'px';
      answer.style.padding = '0 0 16px';
      icon.textContent = '−';
    }
  });
});`,
        htmlTemplate: `
<section class="py-20 bg-white" id="faq">
  <div class="max-w-3xl mx-auto px-4 sm:px-6">
    <h2 class="text-4xl font-black text-gray-900 text-center mb-12">{{sectionTitle}}</h2>
    <div class="space-y-2">
      {{#faqs}}
      <div class="border border-gray-200 rounded-xl overflow-hidden">
        <button class="faq-question w-full text-left px-6 py-5 flex items-center justify-between font-semibold text-gray-900 hover:bg-gray-50 transition-colors">
          {{question}}
          <span class="faq-icon text-xl font-light ml-4 shrink-0" style="color:{{primaryColor}}">+</span>
        </button>
        <div class="faq-answer text-gray-600 leading-relaxed px-6 overflow-hidden transition-all" style="max-height:0;padding:0">
          {{answer}}
        </div>
      </div>
      {{/faqs}}
    </div>
  </div>
</section>`,
    },

    {
        name: 'Section — CTA Banner',
        key: 'section_cta_banner',
        category: 'section',
        description: 'Bold call-to-action banner with headline and button.',
        tags: ['cta', 'banner', 'conversion'],
        siteTypes: ['all'],
        availableTo: ['free', 'silver', 'gold', 'diamond'],
        isActive: true,
        isFeatured: true,
        propsSchema: [
            {key: 'headline', label: 'Headline', type: 'text', defaultValue: 'Ready to get started?', group: 'Content'},
            {
                key: 'subtext',
                label: 'Subtext',
                type: 'text',
                defaultValue: 'Join 10,000+ teams already using our platform.',
                group: 'Content'
            },
            {key: 'ctaLabel', label: 'CTA Label', type: 'text', defaultValue: 'Start for Free', group: 'CTA'},
            {key: 'ctaHref', label: 'CTA Link', type: 'url', defaultValue: '/signup', group: 'CTA'},
            {
                key: 'secondaryLabel',
                label: 'Secondary Label',
                type: 'text',
                defaultValue: 'Talk to sales',
                group: 'CTA'
            },
            {key: 'secondaryHref', label: 'Secondary Link', type: 'url', defaultValue: '/contact', group: 'CTA'},
        ],
        htmlTemplate: `
<section class="py-20" style="background:{{primaryColor}}">
  <div class="max-w-4xl mx-auto px-4 text-center">
    <h2 class="text-4xl sm:text-5xl font-black text-white mb-4">{{headline}}</h2>
    <p class="text-xl text-white/80 mb-10">{{subtext}}</p>
    <div class="flex flex-col sm:flex-row gap-4 justify-center">
      <a href="{{ctaHref}}" class="px-8 py-4 bg-white rounded-xl font-bold text-lg hover:bg-gray-100 transition-colors" style="color:{{primaryColor}}">{{ctaLabel}}</a>
      {{#secondaryLabel}}<a href="{{secondaryHref}}" class="px-8 py-4 rounded-xl border-2 border-white/40 font-bold text-lg text-white hover:bg-white/10 transition-colors">{{secondaryLabel}}</a>{{/secondaryLabel}}
    </div>
  </div>
</section>`,
    },

    {
        name: 'Section — Logo Cloud',
        key: 'section_logo_cloud',
        category: 'section',
        description: 'Trusted by section with company logos.',
        tags: ['logos', 'social-proof', 'brands'],
        siteTypes: ['saas', 'agency'],
        availableTo: ['free', 'silver', 'gold', 'diamond'],
        isActive: true,
        propsSchema: [
            {key: 'label', label: 'Label Text', type: 'text', defaultValue: 'Trusted by teams at', group: 'Content'},
            {
                key: 'logos', label: 'Company Logos', type: 'array', defaultValue: [
                    {name: 'Stripe', logoUrl: ''},
                    {name: 'Shopify', logoUrl: ''},
                    {name: 'Vercel', logoUrl: ''},
                    {name: 'Linear', logoUrl: ''},
                    {name: 'Notion', logoUrl: ''},
                    {name: 'Figma', logoUrl: ''},
                ], group: 'Content', arrayItemSchema: [
                    {key: 'name', label: 'Company Name', type: 'text', defaultValue: 'Company'},
                    {key: 'logoUrl', label: 'Logo URL', type: 'image', defaultValue: ''},
                ]
            },
        ],
        htmlTemplate: `
<section class="py-12 bg-gray-50 border-y border-gray-100">
  <div class="max-w-5xl mx-auto px-4">
    <p class="text-center text-sm font-medium text-gray-400 uppercase tracking-widest mb-8">{{label}}</p>
    <div class="flex flex-wrap items-center justify-center gap-8 sm:gap-12">
      {{#logos}}
      <div class="flex items-center justify-center">
        {{#logoUrl}}
        <img src="{{logoUrl}}" alt="{{name}}" class="h-7 object-contain opacity-50 hover:opacity-80 transition-opacity grayscale"/>
        {{/logoUrl}}
        {{^logoUrl}}
        <span class="text-lg font-black text-gray-300 tracking-tight">{{name}}</span>
        {{/logoUrl}}
      </div>
      {{/logos}}
    </div>
  </div>
</section>`,
    },

    {
        name: 'Section — Team Grid',
        key: 'section_team',
        category: 'section',
        description: 'Team member cards in a responsive grid.',
        tags: ['team', 'about', 'people'],
        siteTypes: ['agency', 'saas', 'portfolio'],
        availableTo: ['silver', 'gold', 'diamond'],
        isActive: true,
        propsSchema: [
            {
                key: 'sectionTitle',
                label: 'Section Title',
                type: 'text',
                defaultValue: 'Meet the team',
                group: 'Content'
            },
            {
                key: 'members', label: 'Team Members', type: 'array', defaultValue: [
                    {
                        name: 'Alex Chen',
                        role: 'CEO & Co-founder',
                        bio: 'Former engineer at Google. Obsessed with building products people love.',
                        photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80'
                    },
                    {
                        name: 'Sarah Park',
                        role: 'Head of Design',
                        bio: 'Previously at Figma and Airbnb. Believes design is problem solving.',
                        photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80'
                    },
                    {
                        name: 'James Wu',
                        role: 'CTO',
                        bio: '10 years building scalable systems. Passionate about developer experience.',
                        photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80'
                    },
                ], group: 'Content', arrayItemSchema: [
                    {key: 'name', label: 'Name', type: 'text', defaultValue: 'Team Member'},
                    {key: 'role', label: 'Role', type: 'text', defaultValue: 'Position'},
                    {key: 'bio', label: 'Bio', type: 'textarea', defaultValue: 'Short bio.'},
                    {key: 'photo', label: 'Photo URL', type: 'image', defaultValue: ''},
                ]
            },
        ],
        htmlTemplate: `
<section class="py-20 bg-white">
  <div class="max-w-5xl mx-auto px-4 sm:px-6">
    <h2 class="text-4xl font-black text-gray-900 text-center mb-12">{{sectionTitle}}</h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
      {{#members}}
      <div class="text-center">
        <div class="w-32 h-32 rounded-2xl overflow-hidden mx-auto mb-4 bg-gray-100">
          {{#photo}}<img src="{{photo}}" alt="{{name}}" class="w-full h-full object-cover"/>{{/photo}}
          {{^photo}}<div class="w-full h-full flex items-center justify-center text-3xl font-bold text-gray-400">{{name}}</div>{{/photo}}
        </div>
        <h3 class="font-bold text-gray-900 text-lg mb-0.5">{{name}}</h3>
        <p class="text-sm font-medium mb-3" style="color:{{primaryColor}}">{{role}}</p>
        <p class="text-sm text-gray-500 leading-relaxed">{{bio}}</p>
      </div>
      {{/members}}
    </div>
  </div>
</section>`,
    },

    {
        name: 'Section — Newsletter Signup',
        key: 'section_newsletter',
        category: 'section',
        description: 'Email newsletter signup with inline form.',
        tags: ['newsletter', 'email', 'signup', 'lead'],
        siteTypes: ['all'],
        availableTo: ['free', 'silver', 'gold', 'diamond'],
        isActive: true,
        propsSchema: [
            {key: 'headline', label: 'Headline', type: 'text', defaultValue: 'Stay in the loop', group: 'Content'},
            {
                key: 'description',
                label: 'Description',
                type: 'text',
                defaultValue: 'Get the latest articles, tips, and resources delivered to your inbox weekly.',
                group: 'Content'
            },
            {
                key: 'placeholder',
                label: 'Input Placeholder',
                type: 'text',
                defaultValue: 'Enter your email address',
                group: 'Content'
            },
            {key: 'buttonLabel', label: 'Button Label', type: 'text', defaultValue: 'Subscribe', group: 'Content'},
        ],
        jsCode: `
document.querySelector('#newsletter-form') && document.querySelector('#newsletter-form').addEventListener('submit', function(e) {
  e.preventDefault();
  var email = this.querySelector('input[type="email"]').value;
  if (!email) return;
  this.innerHTML = '<p class="text-center text-green-600 font-semibold py-2">✓ You\'re subscribed! Check your inbox.</p>';
});`,
        htmlTemplate: `
<section class="py-20 bg-gray-50">
  <div class="max-w-xl mx-auto px-4 text-center">
    <h2 class="text-3xl font-black text-gray-900 mb-3">{{headline}}</h2>
    <p class="text-gray-500 mb-8">{{description}}</p>
    <form id="newsletter-form" class="flex flex-col sm:flex-row gap-3">
      <input type="email" placeholder="{{placeholder}}" required class="flex-1 h-12 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:border-transparent" style="--tw-ring-color:{{primaryColor}}"/>
      <button type="submit" class="h-12 px-6 rounded-xl text-white font-bold hover:opacity-90 transition-opacity shrink-0" style="background:{{primaryColor}}">{{buttonLabel}}</button>
    </form>
    <p class="text-xs text-gray-400 mt-3">No spam. Unsubscribe anytime.</p>
  </div>
</section>`,
    },

    {
        name: 'Section — Product Grid',
        key: 'section_product_grid',
        category: 'section',
        description: 'E-commerce product cards in a responsive grid.',
        tags: ['ecommerce', 'products', 'shop', 'grid'],
        siteTypes: ['ecommerce'],
        availableTo: ['free', 'silver', 'gold', 'diamond'],
        isActive: true,
        isFeatured: true,
        propsSchema: [
            {
                key: 'sectionTitle',
                label: 'Section Title',
                type: 'text',
                defaultValue: 'Featured Products',
                group: 'Content'
            },
            {key: 'viewAllHref', label: 'View All Link', type: 'url', defaultValue: '/shop', group: 'Content'},
            {
                key: 'products', label: 'Products', type: 'array', defaultValue: [
                    {
                        name: 'Classic T-Shirt',
                        price: '$29.00',
                        originalPrice: '$45.00',
                        image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80',
                        href: '/shop/tshirt',
                        badge: 'Sale'
                    },
                    {
                        name: 'Canvas Tote Bag',
                        price: '$34.00',
                        originalPrice: '',
                        image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&q=80',
                        href: '/shop/tote',
                        badge: 'New'
                    },
                    {
                        name: 'Leather Wallet',
                        price: '$59.00',
                        originalPrice: '',
                        image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=400&q=80',
                        href: '/shop/wallet',
                        badge: ''
                    },
                    {
                        name: 'Coffee Mug',
                        price: '$18.00',
                        originalPrice: '',
                        image: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400&q=80',
                        href: '/shop/mug',
                        badge: ''
                    },
                ], group: 'Content', arrayItemSchema: [
                    {key: 'name', label: 'Product Name', type: 'text', defaultValue: 'Product'},
                    {key: 'price', label: 'Price', type: 'text', defaultValue: '$0.00'},
                    {key: 'originalPrice', label: 'Original Price (if on sale)', type: 'text', defaultValue: ''},
                    {key: 'image', label: 'Product Image', type: 'image', defaultValue: ''},
                    {key: 'href', label: 'Product Link', type: 'url', defaultValue: '/shop/product'},
                    {key: 'badge', label: 'Badge (Sale/New/etc)', type: 'text', defaultValue: ''},
                ]
            },
        ],
        htmlTemplate: `
<section class="py-16 bg-white">
  <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex items-center justify-between mb-10">
      <h2 class="text-3xl font-black text-gray-900">{{sectionTitle}}</h2>
      <a href="{{viewAllHref}}" class="text-sm font-semibold hover:opacity-70 transition-opacity" style="color:{{primaryColor}}">View all →</a>
    </div>
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {{#products}}
      <a href="{{href}}" class="group block">
        <div class="relative overflow-hidden rounded-xl bg-gray-100 aspect-square mb-3">
          {{#image}}<img src="{{image}}" alt="{{name}}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/>{{/image}}
          {{#badge}}<span class="absolute top-2 left-2 px-2 py-1 rounded-md text-xs font-bold text-white" style="background:{{primaryColor}}">{{badge}}</span>{{/badge}}
        </div>
        <h3 class="font-semibold text-gray-900 text-sm mb-1 group-hover:opacity-70 transition-opacity">{{name}}</h3>
        <div class="flex items-center gap-2">
          <span class="font-bold text-gray-900">{{price}}</span>
          {{#originalPrice}}<span class="text-sm text-gray-400 line-through">{{originalPrice}}</span>{{/originalPrice}}
        </div>
      </a>
      {{/products}}
    </div>
  </div>
</section>`,
    },

    // ═══════════════════════════════════════════════════════════════
    // FOOTERS (5)
    // ═══════════════════════════════════════════════════════════════

    {
        name: 'Footer — Simple',
        key: 'footer_simple',
        category: 'footer',
        description: 'Minimal footer with logo, links, and copyright.',
        tags: ['simple', 'minimal', 'clean'],
        siteTypes: ['all'],
        availableTo: ['free', 'silver', 'gold', 'diamond'],
        isActive: true,
        isFeatured: true,
        propsSchema: [
            {key: 'brandName', label: 'Brand Name', type: 'text', defaultValue: 'MyBrand', group: 'Brand'},
            {key: 'copyrightYear', label: 'Year', type: 'text', defaultValue: '2025', group: 'Brand'},
            {
                key: 'tagline',
                label: 'Tagline',
                type: 'text',
                defaultValue: 'Building the future, one product at a time.',
                group: 'Brand'
            },
        ],
        htmlTemplate: `
<footer class="bg-gray-950 text-white">
  <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
      <div>
        <a href="/" class="font-black text-xl text-white">{{brandName}}</a>
        <p class="text-gray-400 text-sm mt-2 max-w-xs">{{tagline}}</p>
      </div>
      <nav class="flex flex-wrap gap-6">
        <a href="/about" class="text-sm text-gray-400 hover:text-white transition-colors">About</a>
        <a href="/blog" class="text-sm text-gray-400 hover:text-white transition-colors">Blog</a>
        <a href="/careers" class="text-sm text-gray-400 hover:text-white transition-colors">Careers</a>
        <a href="/privacy" class="text-sm text-gray-400 hover:text-white transition-colors">Privacy</a>
        <a href="/terms" class="text-sm text-gray-400 hover:text-white transition-colors">Terms</a>
      </nav>
    </div>
    <div class="mt-10 pt-6 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
      <p class="text-xs text-gray-500">© {{copyrightYear}} {{brandName}}. All rights reserved.</p>
      <div class="flex items-center gap-4">
        <a href="#" aria-label="Twitter" class="text-gray-500 hover:text-white transition-colors">
          <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"/></svg>
        </a>
        <a href="#" aria-label="LinkedIn" class="text-gray-500 hover:text-white transition-colors">
          <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
        </a>
      </div>
    </div>
  </div>
</footer>`,
    },

    {
        name: 'Footer — Multi-Column',
        key: 'footer_multi_column',
        category: 'footer',
        description: 'Four-column footer with links organized by category.',
        tags: ['multi-column', 'links', 'comprehensive'],
        siteTypes: ['saas', 'agency'],
        availableTo: ['silver', 'gold', 'diamond'],
        isActive: true,
        isFeatured: true,
        propsSchema: [
            {key: 'brandName', label: 'Brand Name', type: 'text', defaultValue: 'Company', group: 'Brand'},
            {
                key: 'brandDescription',
                label: 'Brand Description',
                type: 'textarea',
                defaultValue: 'Making great software accessible to everyone.',
                group: 'Brand'
            },
            {key: 'copyrightYear', label: 'Year', type: 'text', defaultValue: '2025', group: 'Brand'},
        ],
        htmlTemplate: `
<footer class="bg-gray-900 text-white">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
    <div class="grid grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
      <div class="col-span-2">
        <a href="/" class="font-black text-2xl text-white">{{brandName}}</a>
        <p class="text-gray-400 text-sm mt-3 leading-relaxed max-w-xs">{{brandDescription}}</p>
      </div>
      <div>
        <h3 class="font-bold text-sm text-gray-200 uppercase tracking-wider mb-4">Product</h3>
        <ul class="space-y-3">
          <li><a href="/features" class="text-sm text-gray-400 hover:text-white transition-colors">Features</a></li>
          <li><a href="/pricing" class="text-sm text-gray-400 hover:text-white transition-colors">Pricing</a></li>
          <li><a href="/changelog" class="text-sm text-gray-400 hover:text-white transition-colors">Changelog</a></li>
          <li><a href="/roadmap" class="text-sm text-gray-400 hover:text-white transition-colors">Roadmap</a></li>
        </ul>
      </div>
      <div>
        <h3 class="font-bold text-sm text-gray-200 uppercase tracking-wider mb-4">Company</h3>
        <ul class="space-y-3">
          <li><a href="/about" class="text-sm text-gray-400 hover:text-white transition-colors">About</a></li>
          <li><a href="/blog" class="text-sm text-gray-400 hover:text-white transition-colors">Blog</a></li>
          <li><a href="/careers" class="text-sm text-gray-400 hover:text-white transition-colors">Careers</a></li>
          <li><a href="/press" class="text-sm text-gray-400 hover:text-white transition-colors">Press</a></li>
        </ul>
      </div>
      <div>
        <h3 class="font-bold text-sm text-gray-200 uppercase tracking-wider mb-4">Legal</h3>
        <ul class="space-y-3">
          <li><a href="/privacy" class="text-sm text-gray-400 hover:text-white transition-colors">Privacy</a></li>
          <li><a href="/terms" class="text-sm text-gray-400 hover:text-white transition-colors">Terms</a></li>
          <li><a href="/security" class="text-sm text-gray-400 hover:text-white transition-colors">Security</a></li>
          <li><a href="/cookies" class="text-sm text-gray-400 hover:text-white transition-colors">Cookies</a></li>
        </ul>
      </div>
    </div>
    <div class="border-t border-gray-800 pt-8">
      <p class="text-xs text-gray-500 text-center">© {{copyrightYear}} {{brandName}}, Inc. All rights reserved.</p>
    </div>
  </div>
</footer>`,
    },

    {
        name: 'Footer — Restaurant',
        key: 'footer_restaurant',
        category: 'footer',
        description: 'Restaurant footer with hours, address, and social links.',
        tags: ['restaurant', 'location', 'hours'],
        siteTypes: ['restaurant'],
        availableTo: ['free', 'silver', 'gold', 'diamond'],
        isActive: true,
        propsSchema: [
            {
                key: 'restaurantName',
                label: 'Restaurant Name',
                type: 'text',
                defaultValue: 'La Bella Vita',
                group: 'Brand'
            },
            {
                key: 'address',
                label: 'Address',
                type: 'text',
                defaultValue: '123 Main Street, New York, NY 10001',
                group: 'Info'
            },
            {key: 'phone', label: 'Phone', type: 'text', defaultValue: '+1 (212) 555-0123', group: 'Info'},
            {
                key: 'hours',
                label: 'Opening Hours',
                type: 'textarea',
                defaultValue: 'Mon–Fri: 11am – 10pm\nSat–Sun: 10am – 11pm',
                group: 'Info'
            },
            {key: 'copyrightYear', label: 'Year', type: 'text', defaultValue: '2025', group: 'Brand'},
        ],
        htmlTemplate: `
<footer class="bg-gray-950 text-white py-12">
  <div class="max-w-5xl mx-auto px-4 sm:px-6">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
      <div>
        <h3 class="font-black text-2xl mb-4" style="color:{{primaryColor}}">{{restaurantName}}</h3>
        <p class="text-gray-400 text-sm leading-relaxed">{{address}}</p>
        <p class="text-gray-400 text-sm mt-2"><a href="tel:{{phone}}" class="hover:text-white transition-colors">{{phone}}</a></p>
      </div>
      <div>
        <h4 class="font-bold text-sm text-gray-200 uppercase tracking-wider mb-4">Hours</h4>
        <pre class="text-gray-400 text-sm font-sans leading-relaxed whitespace-pre-wrap">{{hours}}</pre>
      </div>
      <div>
        <h4 class="font-bold text-sm text-gray-200 uppercase tracking-wider mb-4">Connect</h4>
        <div class="flex gap-4">
          <a href="#" class="text-gray-400 hover:text-white transition-colors text-sm">Instagram</a>
          <a href="#" class="text-gray-400 hover:text-white transition-colors text-sm">Facebook</a>
          <a href="#" class="text-gray-400 hover:text-white transition-colors text-sm">Yelp</a>
        </div>
      </div>
    </div>
    <div class="border-t border-gray-800 pt-6 text-center">
      <p class="text-xs text-gray-600">© {{copyrightYear}} {{restaurantName}}. All rights reserved.</p>
    </div>
  </div>
</footer>`,
    },

    {
        name: 'Footer — Blog Simple',
        key: 'footer_simple_blog',
        category: 'footer',
        description: 'Minimal blog footer with publication info.',
        tags: ['blog', 'minimal', 'publication'],
        siteTypes: ['blog'],
        availableTo: ['free', 'silver', 'gold', 'diamond'],
        isActive: true,
        propsSchema: [
            {
                key: 'publicationName',
                label: 'Publication Name',
                type: 'text',
                defaultValue: 'The Daily Read',
                group: 'Brand'
            },
            {key: 'copyrightYear', label: 'Year', type: 'text', defaultValue: '2025', group: 'Brand'},
        ],
        htmlTemplate: `
<footer class="border-t border-gray-100 py-10 bg-white">
  <div class="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
    <a href="/" class="font-black text-lg text-gray-900">{{publicationName}}</a>
    <div class="flex items-center gap-6 text-sm text-gray-500">
      <a href="/about" class="hover:text-gray-900 transition-colors">About</a>
      <a href="/privacy" class="hover:text-gray-900 transition-colors">Privacy</a>
      <a href="/rss" class="hover:text-gray-900 transition-colors">RSS</a>
    </div>
    <p class="text-xs text-gray-400">© {{copyrightYear}} {{publicationName}}</p>
  </div>
</footer>`,
    },

    {
        name: 'Footer — Ecommerce',
        key: 'footer_ecommerce',
        category: 'footer',
        description: 'Store footer with policies, payment badges, and trust signals.',
        tags: ['ecommerce', 'store', 'trust', 'policies'],
        siteTypes: ['ecommerce'],
        availableTo: ['free', 'silver', 'gold', 'diamond'],
        isActive: true,
        propsSchema: [
            {key: 'storeName', label: 'Store Name', type: 'text', defaultValue: 'My Store', group: 'Brand'},
            {key: 'copyrightYear', label: 'Year', type: 'text', defaultValue: '2025', group: 'Brand'},
        ],
        htmlTemplate: `
<footer class="bg-gray-50 border-t border-gray-200">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
    <div class="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
      <div>
        <h4 class="font-bold text-sm text-gray-900 mb-3">Shop</h4>
        <ul class="space-y-2 text-sm text-gray-500">
          <li><a href="/shop" class="hover:text-gray-900">All Products</a></li>
          <li><a href="/shop/new" class="hover:text-gray-900">New Arrivals</a></li>
          <li><a href="/shop/sale" class="hover:text-gray-900">Sale</a></li>
        </ul>
      </div>
      <div>
        <h4 class="font-bold text-sm text-gray-900 mb-3">Support</h4>
        <ul class="space-y-2 text-sm text-gray-500">
          <li><a href="/contact" class="hover:text-gray-900">Contact Us</a></li>
          <li><a href="/faq" class="hover:text-gray-900">FAQ</a></li>
          <li><a href="/returns" class="hover:text-gray-900">Returns</a></li>
        </ul>
      </div>
      <div>
        <h4 class="font-bold text-sm text-gray-900 mb-3">Company</h4>
        <ul class="space-y-2 text-sm text-gray-500">
          <li><a href="/about" class="hover:text-gray-900">About Us</a></li>
          <li><a href="/blog" class="hover:text-gray-900">Blog</a></li>
          <li><a href="/privacy" class="hover:text-gray-900">Privacy Policy</a></li>
        </ul>
      </div>
      <div>
        <h4 class="font-bold text-sm text-gray-900 mb-3">Trust</h4>
        <div class="space-y-2 text-xs text-gray-500">
          <p class="flex items-center gap-1.5">🔒 Secure checkout</p>
          <p class="flex items-center gap-1.5">📦 Free shipping over $50</p>
          <p class="flex items-center gap-1.5">↩ 30-day returns</p>
        </div>
      </div>
    </div>
    <div class="border-t border-gray-200 pt-6 text-xs text-gray-400 text-center">
      © {{copyrightYear}} {{storeName}}. All rights reserved.
    </div>
  </div>
</footer>`,
    },

    // ═══════════════════════════════════════════════════════════════
    // WIDGETS (5)
    // ═══════════════════════════════════════════════════════════════

    {
        name: 'Widget — Contact Form',
        key: 'widget_contact_form',
        category: 'widget',
        description: 'Full contact form with name, email, and message fields.',
        tags: ['contact', 'form', 'lead'],
        siteTypes: ['all'],
        availableTo: ['free', 'silver', 'gold', 'diamond'],
        isActive: true,
        isFeatured: true,
        propsSchema: [
            {key: 'formTitle', label: 'Form Title', type: 'text', defaultValue: 'Get in touch', group: 'Content'},
            {
                key: 'formSubtitle',
                label: 'Subtitle',
                type: 'text',
                defaultValue: 'We typically reply within 24 hours.',
                group: 'Content'
            },
            {
                key: 'submitLabel',
                label: 'Submit Button Label',
                type: 'text',
                defaultValue: 'Send Message',
                group: 'Content'
            },
            {
                key: 'successMessage',
                label: 'Success Message',
                type: 'text',
                defaultValue: 'Thanks! We\'ll be in touch soon.',
                group: 'Content'
            },
        ],
        jsCode: `
document.querySelector('#contact-form') && document.querySelector('#contact-form').addEventListener('submit', function(e) {
  e.preventDefault();
  var data = { name: this.name.value, email: this.email.value, message: this.message.value };
  var btn = this.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.textContent = 'Sending...';
  fetch('/api/contact', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(data) })
    .then(function() {
      document.querySelector('#contact-form').innerHTML = '<div class="text-center py-8"><p class="text-2xl mb-2">✓</p><p class="font-semibold text-gray-900">Message sent!</p><p class="text-gray-500 text-sm mt-1">We\'ll be in touch soon.</p></div>';
    })
    .catch(function() { btn.disabled = false; btn.textContent = 'Send Message'; });
});`,
        htmlTemplate: `
<section class="py-16 bg-white" id="contact">
  <div class="max-w-2xl mx-auto px-4 sm:px-6">
    <div class="text-center mb-10">
      <h2 class="text-4xl font-black text-gray-900 mb-2">{{formTitle}}</h2>
      <p class="text-gray-500">{{formSubtitle}}</p>
    </div>
    <form id="contact-form" class="space-y-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
          <input name="name" type="text" required placeholder="John Smith" class="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:border-transparent" style="--tw-ring-color:{{primaryColor}}"/>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
          <input name="email" type="email" required placeholder="john@example.com" class="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:border-transparent" style="--tw-ring-color:{{primaryColor}}"/>
        </div>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1.5">Message</label>
        <textarea name="message" required rows="5" placeholder="Tell us how we can help..." class="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:border-transparent" style="--tw-ring-color:{{primaryColor}}"></textarea>
      </div>
      <button type="submit" class="w-full h-12 rounded-xl text-white font-bold hover:opacity-90 transition-opacity" style="background:{{primaryColor}}">{{submitLabel}}</button>
    </form>
  </div>
</section>`,
    },

    {
        name: 'Widget — WhatsApp Order Button',
        key: 'widget_whatsapp_order',
        category: 'widget',
        description: 'WhatsApp order button — sends pre-filled order message. Key differentiator for non-western markets.',
        tags: ['whatsapp', 'order', 'ecommerce', 'cta'],
        siteTypes: ['ecommerce', 'restaurant'],
        availableTo: ['free', 'silver', 'gold', 'diamond'],
        isActive: true,
        isFeatured: true,
        propsSchema: [
            {
                key: 'whatsappNumber',
                label: 'WhatsApp Number (with country code)',
                type: 'text',
                defaultValue: '+1234567890',
                group: 'WhatsApp'
            },
            {
                key: 'defaultMessage',
                label: 'Pre-filled Message',
                type: 'textarea',
                defaultValue: 'Hi! I\'d like to place an order. Please help me with the details.',
                group: 'WhatsApp'
            },
            {
                key: 'buttonLabel',
                label: 'Button Label',
                type: 'text',
                defaultValue: 'Order via WhatsApp',
                group: 'Content'
            },
            {
                key: 'subtext',
                label: 'Subtext',
                type: 'text',
                defaultValue: 'Fast response • No account needed',
                group: 'Content'
            },
        ],
        jsCode: `
document.querySelector('#whatsapp-btn') && document.querySelector('#whatsapp-btn').addEventListener('click', function() {
  var number = this.dataset.number.replace(/[^0-9]/g, '');
  var message = encodeURIComponent(this.dataset.message);
  window.open('https://wa.me/' + number + '?text=' + message, '_blank');
});`,
        htmlTemplate: `
<div class="py-8 flex flex-col items-center gap-3">
  <button id="whatsapp-btn" data-number="{{whatsappNumber}}" data-message="{{defaultMessage}}" class="inline-flex items-center gap-3 px-8 py-4 rounded-2xl text-white font-bold text-lg shadow-lg hover:opacity-90 active:scale-95 transition-all" style="background:#25D366">
    <svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
    {{buttonLabel}}
  </button>
  {{#subtext}}<p class="text-xs text-gray-500">{{subtext}}</p>{{/subtext}}
</div>`,
    },

    {
        name: 'Widget — Stats Counter',
        key: 'widget_stats_counter',
        category: 'widget',
        description: 'Animated number stats in a horizontal row.',
        tags: ['stats', 'numbers', 'social-proof'],
        siteTypes: ['all'],
        availableTo: ['free', 'silver', 'gold', 'diamond'],
        isActive: true,
        propsSchema: [
            {
                key: 'stats', label: 'Stats', type: 'array', defaultValue: [
                    {value: '10K+', label: 'Customers'},
                    {value: '99.9%', label: 'Uptime'},
                    {value: '$2M+', label: 'Revenue generated'},
                    {value: '4.9/5', label: 'Average rating'},
                ], group: 'Content', arrayItemSchema: [
                    {key: 'value', label: 'Value', type: 'text', defaultValue: '100+'},
                    {key: 'label', label: 'Label', type: 'text', defaultValue: 'Metric'},
                ]
            },
        ],
        htmlTemplate: `
<section class="py-12 bg-white border-y border-gray-100">
  <div class="max-w-5xl mx-auto px-4">
    <div class="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
      {{#stats}}
      <div>
        <div class="text-4xl font-black mb-1" style="color:{{primaryColor}}">{{value}}</div>
        <div class="text-sm text-gray-500">{{label}}</div>
      </div>
      {{/stats}}
    </div>
  </div>
</section>`,
    },

    {
        name: 'Widget — Video Embed',
        key: 'widget_video_embed',
        category: 'widget',
        description: 'YouTube or Vimeo embed with play button overlay.',
        tags: ['video', 'embed', 'youtube', 'media'],
        siteTypes: ['all'],
        availableTo: ['silver', 'gold', 'diamond'],
        isActive: true,
        propsSchema: [
            {key: 'videoId', label: 'YouTube Video ID', type: 'text', defaultValue: 'dQw4w9WgXcQ', group: 'Media'},
            {
                key: 'thumbnailUrl',
                label: 'Custom Thumbnail (optional)',
                type: 'image',
                defaultValue: '',
                group: 'Media'
            },
            {
                key: 'sectionTitle',
                label: 'Section Title',
                type: 'text',
                defaultValue: 'Watch how it works',
                group: 'Content'
            },
        ],
        jsCode: `
document.querySelector('.video-play-btn') && document.querySelector('.video-play-btn').addEventListener('click', function() {
  var id = this.dataset.videoid;
  var wrapper = this.parentElement;
  wrapper.innerHTML = '<iframe class="w-full aspect-video rounded-2xl" src="https://www.youtube.com/embed/' + id + '?autoplay=1" frameborder="0" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture" allowfullscreen></iframe>';
});`,
        htmlTemplate: `
<section class="py-16 bg-white">
  <div class="max-w-4xl mx-auto px-4">
    {{#sectionTitle}}<h2 class="text-3xl font-black text-gray-900 text-center mb-8">{{sectionTitle}}</h2>{{/sectionTitle}}
    <div class="relative rounded-2xl overflow-hidden shadow-2xl bg-gray-900 aspect-video cursor-pointer group">
      {{#thumbnailUrl}}
      <img src="{{thumbnailUrl}}" alt="Video thumbnail" class="w-full h-full object-cover opacity-80"/>
      {{/thumbnailUrl}}
      {{^thumbnailUrl}}
      <img src="https://img.youtube.com/vi/{{videoId}}/maxresdefault.jpg" alt="Video thumbnail" class="w-full h-full object-cover opacity-80"/>
      {{/thumbnailUrl}}
      <button class="video-play-btn absolute inset-0 flex items-center justify-center" data-videoid="{{videoId}}">
        <div class="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center shadow-xl group-hover:scale-105 transition-transform">
          <svg class="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
        </div>
      </button>
    </div>
  </div>
</section>`,
    },

    {
        name: 'Widget — Cookie Banner',
        key: 'widget_cookie_banner',
        category: 'widget',
        description: 'GDPR-compliant cookie consent banner.',
        tags: ['cookie', 'gdpr', 'consent', 'legal'],
        siteTypes: ['all'],
        availableTo: ['free', 'silver', 'gold', 'diamond'],
        isActive: true,
        propsSchema: [
            {
                key: 'message',
                label: 'Cookie Message',
                type: 'textarea',
                defaultValue: 'We use cookies to improve your experience and analyze traffic. By clicking Accept, you consent to our use of cookies.',
                group: 'Content'
            },
            {key: 'acceptLabel', label: 'Accept Button', type: 'text', defaultValue: 'Accept All', group: 'Content'},
            {key: 'declineLabel', label: 'Decline Button', type: 'text', defaultValue: 'Decline', group: 'Content'},
            {key: 'privacyHref', label: 'Privacy Policy Link', type: 'url', defaultValue: '/privacy', group: 'Content'},
        ],
        jsCode: `
(function() {
  var banner = document.getElementById('cookie-banner');
  if (!banner) return;
  if (localStorage.getItem('cookie_consent')) { banner.remove(); return; }
  banner.style.display = 'flex';
  document.getElementById('cookie-accept') && document.getElementById('cookie-accept').addEventListener('click', function() {
    localStorage.setItem('cookie_consent', 'accepted');
    banner.remove();
  });
  document.getElementById('cookie-decline') && document.getElementById('cookie-decline').addEventListener('click', function() {
    localStorage.setItem('cookie_consent', 'declined');
    banner.remove();
  });
})();`,
        htmlTemplate: `
<div id="cookie-banner" style="display:none" class="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 bg-gray-950 text-white rounded-2xl shadow-2xl p-5 flex flex-col gap-4">
  <p class="text-sm text-gray-300 leading-relaxed">{{message}} <a href="{{privacyHref}}" class="underline text-white/70 hover:text-white">Privacy Policy</a></p>
  <div class="flex gap-2">
    <button id="cookie-accept" class="flex-1 py-2 rounded-xl text-sm font-bold text-white hover:opacity-90 transition-opacity" style="background:{{primaryColor}}">{{acceptLabel}}</button>
    <button id="cookie-decline" class="flex-1 py-2 rounded-xl text-sm font-medium text-gray-400 border border-gray-700 hover:border-gray-500 transition-colors">{{declineLabel}}</button>
  </div>
</div>`,
    },

    // ═══════════════════════════════════════════════════════════════
    // ANIMATIONS (3 — applied as wrappers)
    // ═══════════════════════════════════════════════════════════════

    {
        name: 'Animation — Fade In Up',
        key: 'animation_fade_in_up',
        category: 'animation',
        description: 'Fade in from below on scroll. Add to any section.',
        tags: ['fade', 'scroll', 'animation'],
        siteTypes: ['all'],
        availableTo: ['silver', 'gold', 'diamond'],
        isActive: true,
        propsSchema: [
            {
                key: 'content',
                label: 'Content (HTML)',
                type: 'richtext',
                defaultValue: '<p class="text-center text-lg text-gray-700">Your content here — this section will fade in from below when scrolled into view.</p>',
                group: 'Content'
            },
            {key: 'delay', label: 'Delay (ms)', type: 'number', defaultValue: 0, group: 'Animation'},
        ],
        cssCode: `
.anim-fade-up { opacity: 0; transform: translateY(32px); transition: opacity 0.6s ease, transform 0.6s ease; }
.anim-fade-up.visible { opacity: 1; transform: translateY(0); }`,
        jsCode: `
(function() {
  var els = document.querySelectorAll('.anim-fade-up');
  if (!els.length) return;
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(e) {
      if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); }
    });
  }, { threshold: 0.15 });
  els.forEach(function(el) { observer.observe(el); });
})();`,
        htmlTemplate: `
<div class="anim-fade-up py-8" style="transition-delay:{{delay}}ms">
  {{html:content}}
</div>`,
    },

    {
        name: 'Animation — Marquee / Ticker',
        key: 'animation_marquee',
        category: 'animation',
        description: 'Infinite horizontal scrolling marquee for logos or text.',
        tags: ['marquee', 'ticker', 'loop', 'logos'],
        siteTypes: ['all'],
        availableTo: ['silver', 'gold', 'diamond'],
        isActive: true,
        propsSchema: [
            {
                key: 'items', label: 'Marquee Items', type: 'array', defaultValue: [
                    {text: 'Fast ⚡'}, {text: 'Reliable 🔒'}, {text: 'Scalable 📈'},
                    {text: 'Beautiful ✨'}, {text: 'Affordable 💰'}, {text: 'Simple 🎯'},
                ], group: 'Content', arrayItemSchema: [
                    {key: 'text', label: 'Text', type: 'text', defaultValue: 'Item'},
                ]
            },
            {key: 'speed', label: 'Speed (seconds)', type: 'number', defaultValue: 20, group: 'Animation'},
            {key: 'bgColor', label: 'Background Color', type: 'color', defaultValue: '#f9fafb', group: 'Style'},
        ],
        cssCode: `
@keyframes marquee-scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
.marquee-track { animation: marquee-scroll linear infinite; display: flex; width: max-content; }
.marquee-wrap { overflow: hidden; }`,
        htmlTemplate: `
<div class="marquee-wrap py-6 border-y border-gray-100" style="background:{{bgColor}}">
  <div class="marquee-track" style="animation-duration:{{speed}}s">
    {{#items}}<span class="inline-flex items-center px-8 text-lg font-bold text-gray-700 shrink-0">{{text}}</span>{{/items}}
    {{#items}}<span class="inline-flex items-center px-8 text-lg font-bold text-gray-700 shrink-0">{{text}}</span>{{/items}}
  </div>
</div>`,
    },

    {
        name: 'Animation — Counter',
        key: 'animation_counter',
        category: 'animation',
        description: 'Number counts up from 0 when scrolled into view.',
        tags: ['counter', 'number', 'scroll', 'stats'],
        siteTypes: ['all'],
        availableTo: ['gold', 'diamond'],
        isActive: true,
        propsSchema: [
            {key: 'targetNumber', label: 'Target Number', type: 'number', defaultValue: 10000, group: 'Content'},
            {key: 'suffix', label: 'Suffix (e.g. +, %)', type: 'text', defaultValue: '+', group: 'Content'},
            {key: 'label', label: 'Label', type: 'text', defaultValue: 'Happy customers', group: 'Content'},
            {key: 'duration', label: 'Duration (ms)', type: 'number', defaultValue: 2000, group: 'Animation'},
        ],
        jsCode: `
(function() {
  var el = document.querySelector('.count-target');
  if (!el) return;
  var target = parseInt(el.dataset.target) || 0;
  var duration = parseInt(el.dataset.duration) || 2000;
  var suffix = el.dataset.suffix || '';
  var started = false;
  var observer = new IntersectionObserver(function(entries) {
    if (entries[0].isIntersecting && !started) {
      started = true;
      var start = performance.now();
      function update(now) {
        var progress = Math.min((now - start) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.floor(eased * target).toLocaleString() + suffix;
        if (progress < 1) requestAnimationFrame(update);
      }
      requestAnimationFrame(update);
      observer.unobserve(el);
    }
  }, { threshold: 0.5 });
  observer.observe(el);
})();`,
        htmlTemplate: `
<div class="py-12 text-center">
  <div class="count-target text-6xl font-black mb-2" data-target="{{targetNumber}}" data-suffix="{{suffix}}" data-duration="{{duration}}" style="color:{{primaryColor}}">0{{suffix}}</div>
  <p class="text-gray-500 text-lg">{{label}}</p>
</div>`,
    },

    // ═══════════════════════════════════════════════════════════════
    // LAYOUTS (2)
    // ═══════════════════════════════════════════════════════════════

    {
        name: 'Layout — Two Column',
        key: 'layout_two_column',
        category: 'layout',
        description: 'Two equal columns layout for flexible content arrangement.',
        tags: ['layout', 'columns', 'grid'],
        siteTypes: ['all'],
        availableTo: ['silver', 'gold', 'diamond'],
        isActive: true,
        propsSchema: [
            {
                key: 'leftContent',
                label: 'Left Column HTML',
                type: 'richtext',
                defaultValue: '<div class="p-8 rounded-2xl bg-gray-50"><h3 class="text-xl font-bold mb-3">Left Column</h3><p class="text-gray-600">Add your content here.</p></div>',
                group: 'Content'
            },
            {
                key: 'rightContent',
                label: 'Right Column HTML',
                type: 'richtext',
                defaultValue: '<div class="p-8 rounded-2xl bg-gray-50"><h3 class="text-xl font-bold mb-3">Right Column</h3><p class="text-gray-600">Add your content here.</p></div>',
                group: 'Content'
            },
            {
                key: 'gap',
                label: 'Gap Size',
                type: 'select',
                defaultValue: 'gap-8',
                options: ['gap-4', 'gap-8', 'gap-12', 'gap-16'],
                group: 'Style'
            },
        ],
        htmlTemplate: `
<section class="py-12">
  <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="grid grid-cols-1 lg:grid-cols-2 {{gap}} items-start">
      <div>{{html:leftContent}}</div>
      <div>{{html:rightContent}}</div>
    </div>
  </div>
</section>`,
    },

    {
        name: 'Layout — Section Divider',
        key: 'layout_divider',
        category: 'layout',
        description: 'Visual section divider with optional label.',
        tags: ['divider', 'separator', 'spacing'],
        siteTypes: ['all'],
        availableTo: ['free', 'silver', 'gold', 'diamond'],
        isActive: true,
        propsSchema: [
            {key: 'label', label: 'Label (optional)', type: 'text', defaultValue: '', group: 'Content'},
            {
                key: 'style',
                label: 'Style',
                type: 'select',
                defaultValue: 'line',
                options: ['line', 'gradient', 'dots', 'wave'],
                group: 'Style'
            },
            {
                key: 'spacing',
                label: 'Vertical Spacing',
                type: 'select',
                defaultValue: 'py-8',
                options: ['py-4', 'py-8', 'py-12', 'py-16'],
                group: 'Style'
            },
        ],
        htmlTemplate: `
<div class="{{spacing}} relative flex items-center justify-center">
  {{#label}}
  <div class="flex items-center gap-4 w-full max-w-4xl mx-auto px-4">
    <div class="flex-1 h-px bg-gray-200"></div>
    <span class="text-xs font-semibold text-gray-400 uppercase tracking-widest whitespace-nowrap">{{label}}</span>
    <div class="flex-1 h-px bg-gray-200"></div>
  </div>
  {{/label}}
  {{^label}}
  <div class="w-full max-w-4xl mx-auto px-4">
    <div class="h-px bg-gray-200"></div>
  </div>
  {{/label}}
</div>`,
    },

    // ═══════════════════════════════════════════════════════════════
    // INTEGRATIONS (2)
    // ═══════════════════════════════════════════════════════════════

    {
        name: 'Integration — Google Maps',
        key: 'integration_google_maps',
        category: 'integration',
        description: 'Embed a Google Maps location for your business.',
        tags: ['map', 'location', 'google', 'address'],
        siteTypes: ['restaurant', 'agency', 'all'],
        availableTo: ['silver', 'gold', 'diamond'],
        isActive: true,
        propsSchema: [
            {
                key: 'mapEmbedUrl',
                label: 'Google Maps Embed URL',
                type: 'url',
                defaultValue: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3022.9663095343008!2d-74.00425878459418!3d40.74076684379132!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c259bf5c1654f3%3A0xc80f9cfce5383d5d!2sEmpire%20State%20Building!5e0!3m2!1sen!2sus!4v1234567890',
                group: 'Map'
            },
            {key: 'height', label: 'Height (px)', type: 'number', defaultValue: 400, group: 'Style'},
        ],
        htmlTemplate: `
<section class="w-full overflow-hidden" style="height:{{height}}px">
  <iframe src="{{mapEmbedUrl}}" width="100%" height="{{height}}" style="border:0" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="Location map"></iframe>
</section>`,
    },

    {
        name: 'Integration — Custom HTML',
        key: 'integration_custom_html',
        category: 'integration',
        description: 'Paste any custom HTML embed code (Calendly, Typeform, etc.).',
        tags: ['custom', 'embed', 'html', 'iframe'],
        siteTypes: ['all'],
        availableTo: ['gold', 'diamond'],
        isActive: true,
        propsSchema: [
            {
                key: 'embedCode',
                label: 'Embed / HTML Code',
                type: 'richtext',
                defaultValue: '<p class="text-center text-gray-400 py-8 text-sm">Paste your embed code here (Calendly, Typeform, HubSpot form, etc.)</p>',
                group: 'Content'
            },
            {key: 'containerClass', label: 'Container CSS Classes', type: 'text', defaultValue: 'py-8', group: 'Style'},
        ],
        htmlTemplate: `
<div class="{{containerClass}}">
  <div class="max-w-4xl mx-auto px-4">
    {{html:embedCode}}
  </div>
</div>`,
    },

];

// ─────────────────────────────────────────────────────────────────────────────
// Seed runner
// ─────────────────────────────────────────────────────────────────────────────

async function seed() {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI!);
    console.log('Connected.\n');

    let inserted = 0;
    let updated = 0;

    for (const comp of components) {
        // Build defaultProps from propsSchema
        const defaultProps: Record<string, unknown> = {};
        for (const prop of (comp.propsSchema ?? [])) {
            defaultProps[prop.key] = prop.defaultValue ?? '';
        }

        const result = await PlanComponentModel.findOneAndUpdate(
            {key: comp.key},
            {
                $set: {
                    ...comp,
                    defaultProps,
                },
            },
            {upsert: true, new: true, setDefaultsOnInsert: true}
        );

        const isNew = result.createdAt.getTime() === result.updatedAt.getTime();
        if (isNew) {
            inserted++;
            console.log(`  ✓ Created: ${comp.name}`);
        } else {
            updated++;
            console.log(`  ↺ Updated: ${comp.name}`);
        }
    }

    console.log(`\n✅ Done. ${inserted} created, ${updated} updated. Total: ${components.length} components.`);
    await mongoose.disconnect();
}

seed().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
});