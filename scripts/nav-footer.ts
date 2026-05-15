/**
 * scripts/seed-navbar-footer.ts
 * Seeds ONE navbar and ONE footer component.
 * Run: npx tsx scripts/seed-navbar-footer.ts
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import PlanComponentModel from '../models/PlanComponent';

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) throw new Error('MONGODB_URI missing');

// ============================================
// ONE NAVBAR - Modern Glass with Hamburger
// ============================================
const NAVBAR = {
    name: 'Navbar — Aurora Glass New',
    key: 'navbar_aurora_glass_new',
    category: 'navbar',
    description: 'Glassmorphism navbar with hamburger menu. Fully responsive mobile/desktop.',
    tags: ['glass', 'modern', 'responsive', 'hamburger'],
    siteTypes: ['all'],
    availableTo: ['free', 'silver', 'gold', 'diamond'],
    isActive: true,
    isFeatured: true,
    isPremium: false,
    propsSchema: [
        { key: 'logoText', label: 'Logo Text', type: 'text', defaultValue: 'AURORA', group: 'Brand' },
        { key: 'ctaLabel', label: 'CTA Button', type: 'text', defaultValue: 'Get Started', group: 'CTA' },
        { key: 'ctaHref', label: 'CTA Link', type: 'url', defaultValue: '/signup', group: 'CTA' },
    ],
    htmlTemplate: `
<nav class="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-white/20 shadow-sm">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex justify-between items-center h-16">
      <!-- Logo -->
      <a href="/" class="text-2xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">{{logoText}}</a>
      
      <!-- Desktop Menu -->
      <div class="hidden md:flex items-center gap-8">
        <a href="/" class="text-gray-700 hover:text-indigo-600 transition">Home</a>
        <a href="/about" class="text-gray-700 hover:text-indigo-600 transition">About</a>
        <a href="/services" class="text-gray-700 hover:text-indigo-600 transition">Services</a>
        <a href="/contact" class="text-gray-700 hover:text-indigo-600 transition">Contact</a>
      </div>
      
      <!-- Desktop CTA + Hamburger -->
      <div class="flex items-center gap-4">
        <a href="{{ctaHref}}" class="hidden md:inline-block px-5 py-2 rounded-full text-white font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-lg transition">{{ctaLabel}}</a>
        <button id="menuBtn" class="md:hidden p-2 rounded-lg hover:bg-gray-100">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>
      </div>
    </div>
    
    <!-- Mobile Menu -->
    <div id="mobileMenu" class="hidden md:hidden pb-4 space-y-2">
      <a href="/" class="block py-2 px-3 rounded-lg text-gray-700 hover:bg-gray-100">Home</a>
      <a href="/about" class="block py-2 px-3 rounded-lg text-gray-700 hover:bg-gray-100">About</a>
      <a href="/services" class="block py-2 px-3 rounded-lg text-gray-700 hover:bg-gray-100">Services</a>
      <a href="/contact" class="block py-2 px-3 rounded-lg text-gray-700 hover:bg-gray-100">Contact</a>
      <a href="{{ctaHref}}" class="block mt-4 py-2 px-3 rounded-full text-white font-semibold text-center bg-gradient-to-r from-indigo-600 to-purple-600">{{ctaLabel}}</a>
    </div>
  </div>
</nav>
<script>
document.getElementById('menuBtn')?.addEventListener('click', () => {
  document.getElementById('mobileMenu').classList.toggle('hidden');
});
</script>`,
    defaultProps: { logoText: 'AURORA', ctaLabel: 'Get Started', ctaHref: '/signup' }
};

// ============================================
// ONE FOOTER - Modern Gradient
// ============================================
const FOOTER = {
    name: 'Footer — Gradient Wave New',
    key: 'footer_gradient_wave_new',
    category: 'footer',
    description: 'Modern gradient footer with responsive columns. Stacks nicely on mobile.',
    tags: ['gradient', 'modern', 'responsive', 'columns'],
    siteTypes: ['all'],
    availableTo: ['free', 'silver', 'gold', 'diamond'],
    isActive: true,
    isFeatured: true,
    isPremium: false,
    propsSchema: [
        { key: 'brandName', label: 'Brand Name', type: 'text', defaultValue: 'AURORA', group: 'Brand' },
        { key: 'copyrightYear', label: 'Year', type: 'text', defaultValue: '2025', group: 'Legal' },
    ],
    htmlTemplate: `
<footer class="bg-gradient-to-br from-gray-900 to-gray-800 text-white mt-auto">
  <div class="max-w-7xl mx-auto px-4 py-12">
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
      <!-- Brand Column -->
      <div class="lg:col-span-1">
        <h3 class="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-4">{{brandName}}</h3>
        <p class="text-gray-400 text-sm">Creating digital experiences that matter.</p>
      </div>
      
      <!-- Product Links -->
      <div>
        <h4 class="font-semibold mb-3 text-gray-200">Product</h4>
        <ul class="space-y-2 text-sm text-gray-400">
          <li><a href="/features" class="hover:text-white transition">Features</a></li>
          <li><a href="/pricing" class="hover:text-white transition">Pricing</a></li>
          <li><a href="/demo" class="hover:text-white transition">Demo</a></li>
        </ul>
      </div>
      
      <!-- Company Links -->
      <div>
        <h4 class="font-semibold mb-3 text-gray-200">Company</h4>
        <ul class="space-y-2 text-sm text-gray-400">
          <li><a href="/about" class="hover:text-white transition">About</a></li>
          <li><a href="/blog" class="hover:text-white transition">Blog</a></li>
          <li><a href="/careers" class="hover:text-white transition">Careers</a></li>
        </ul>
      </div>
      
      <!-- Legal Links -->
      <div>
        <h4 class="font-semibold mb-3 text-gray-200">Legal</h4>
        <ul class="space-y-2 text-sm text-gray-400">
          <li><a href="/privacy" class="hover:text-white transition">Privacy</a></li>
          <li><a href="/terms" class="hover:text-white transition">Terms</a></li>
          <li><a href="/cookies" class="hover:text-white transition">Cookies</a></li>
        </ul>
      </div>
    </div>
    
    <!-- Copyright -->
    <div class="border-t border-gray-700 mt-8 pt-6 text-center text-sm text-gray-400">
      © {{copyrightYear}} {{brandName}}. All rights reserved.
    </div>
  </div>
</footer>`,
    defaultProps: { brandName: 'AURORA', copyrightYear: '2025' }
};

// ============================================
// SEED RUNNER
// ============================================
async function seed() {
    console.log('Connecting...');
    await mongoose.connect(MONGODB_URI!);

    // Seed Navbar
    const navResult = await PlanComponentModel.findOneAndUpdate(
        { key: NAVBAR.key },
        { $set: NAVBAR },
        { upsert: true, new: true }
    );
    console.log(`${navResult.createdAt.getTime() === navResult.updatedAt.getTime() ? 'Created' : 'Updated'}: ${NAVBAR.name}`);

    // Seed Footer
    const footResult = await PlanComponentModel.findOneAndUpdate(
        { key: FOOTER.key },
        { $set: FOOTER },
        { upsert: true, new: true }
    );
    console.log(`${footResult.createdAt.getTime() === footResult.updatedAt.getTime() ? 'Created' : 'Updated'}: ${FOOTER.name}`);

    console.log('\n✅ Done! Navbar + Footer seeded.');
    await mongoose.disconnect();
}

seed().catch(console.error);
// /**
//  * scripts/seed-components.ts
//  *
//  * Seeds ONLY one navbar and one footer component into MongoDB.
//  * Run once: npx tsx scripts/seed-components.ts
//  *
//  * Requirements:
//  *   - MONGODB_URI in your .env file
//  *   - npx tsx (install: npm install -D tsx)
//  *
//  * Safe to re-run: uses upsert on `key` field so no duplicates.
//  */
//
// import 'dotenv/config';
// import mongoose from 'mongoose';
// import PlanComponentModel from '../models/PlanComponent';
//
// const MONGODB_URI = process.env.MONGODB_URI;
// if (!MONGODB_URI) throw new Error('MONGODB_URI missing in .env');
//
// // ─────────────────────────────────────────────────────────────────────────────
// // ONE UNIQUE NAVBAR — Modern Glassmorphism with Smooth Dropdown
// // ─────────────────────────────────────────────────────────────────────────────
//
// const uniqueNavbar = {
//     name: 'Navbar — Aurora Glass',
//     key: 'navbar_aurora_glass',
//     category: 'navbar' as const,
//     description: 'Premium glassmorphism navbar with animated aurora gradient background, smooth mobile hamburger menu, and sticky behavior.',
//     tags: ['glassmorphism', 'aurora', 'gradient', 'sticky', 'premium', 'modern', 'animated'],
//     siteTypes: ['all', 'saas', 'agency', 'portfolio', 'restaurant'],
//     availableTo: ['free', 'silver', 'gold', 'diamond'],
//     isActive: true,
//     isFeatured: true,
//     isPremium: false,
//     previewImage: '',
//     propsSchema: [
//         {
//             key: 'logoText',
//             label: 'Logo Text',
//             type: 'text',
//             defaultValue: 'AURORA',
//             group: 'Brand'
//         },
//         {
//             key: 'logoUrl',
//             label: 'Logo Image URL',
//             type: 'image',
//             defaultValue: '',
//             group: 'Brand'
//         },
//         {
//             key: 'navLinks',
//             label: 'Navigation Links',
//             type: 'array',
//             defaultValue: [
//                 {label: 'Home', href: '/'},
//                 {label: 'Services', href: '/services'},
//                 {label: 'Work', href: '/work'},
//                 {label: 'About', href: '/about'},
//                 {label: 'Contact', href: '/contact'}
//             ],
//             arrayItemSchema: [
//                 {key: 'label', label: 'Link Label', type: 'text', defaultValue: ''},
//                 {key: 'href', label: 'URL', type: 'url', defaultValue: '/'}
//             ],
//             group: 'Navigation'
//         },
//         {
//             key: 'ctaLabel',
//             label: 'CTA Button Label',
//             type: 'text',
//             defaultValue: 'Get Started',
//             group: 'CTA'
//         },
//         {
//             key: 'ctaHref',
//             label: 'CTA Button URL',
//             type: 'url',
//             defaultValue: '/signup',
//             group: 'CTA'
//         },
//         {
//             key: 'isSticky',
//             label: 'Sticky Navigation',
//             type: 'boolean',
//             defaultValue: true,
//             group: 'Behavior'
//         },
//         {
//             key: 'blurIntensity',
//             label: 'Blur Intensity',
//             type: 'select',
//             defaultValue: '12px',
//             options: ['4px', '8px', '12px', '16px', '20px'],
//             group: 'Style'
//         }
//     ],
//     cssCode: `
// /* Aurora animation keyframes */
// @keyframes aurora {
//     0% { background-position: 0% 50%; }
//     50% { background-position: 100% 50%; }
//     100% { background-position: 0% 50%; }
// }
//
// @keyframes float {
//     0%, 100% { transform: translateY(0px); }
//     50% { transform: translateY(-2px); }
// }
//
// @keyframes glowPulse {
//     0%, 100% { opacity: 0.6; filter: blur(8px); }
//     50% { opacity: 1; filter: blur(12px); }
// }
//
// .nav-aurora {
//     background: rgba(255, 255, 255, 0.85);
//     backdrop-filter: blur({{blurIntensity}});
//     -webkit-backdrop-filter: blur({{blurIntensity}});
//     border-bottom: 1px solid rgba(255, 255, 255, 0.3);
//     transition: all 0.3s ease;
// }
//
// .nav-aurora::before {
//     content: '';
//     position: absolute;
//     top: 0;
//     left: 0;
//     right: 0;
//     bottom: 0;
//     background: linear-gradient(
//         135deg,
//         rgba(99, 102, 241, 0.15) 0%,
//         rgba(168, 85, 247, 0.15) 25%,
//         rgba(236, 72, 153, 0.15) 50%,
//         rgba(168, 85, 247, 0.15) 75%,
//         rgba(99, 102, 241, 0.15) 100%
//     );
//     background-size: 300% 300%;
//     animation: aurora 8s ease infinite;
//     pointer-events: none;
//     border-radius: inherit;
// }
//
// .nav-aurora.sticky {
//     position: sticky;
//     top: 0;
//     z-index: 50;
// }
//
// .nav-link {
//     position: relative;
//     transition: all 0.2s ease;
// }
//
// .nav-link::after {
//     content: '';
//     position: absolute;
//     bottom: -4px;
//     left: 0;
//     width: 0;
//     height: 2px;
//     background: linear-gradient(135deg, #6366f1, #a855f7);
//     transition: width 0.3s ease;
// }
//
// .nav-link:hover::after {
//     width: 100%;
// }
//
// .nav-link:hover {
//     transform: translateY(-1px);
// }
//
// .mobile-nav-item {
//     transform: translateX(-20px);
//     opacity: 0;
//     animation: slideIn 0.3s ease forwards;
// }
//
// @keyframes slideIn {
//     to {
//         transform: translateX(0);
//         opacity: 1;
//     }
// }
//
// .mobile-nav-item:nth-child(1) { animation-delay: 0.05s; }
// .mobile-nav-item:nth-child(2) { animation-delay: 0.1s; }
// .mobile-nav-item:nth-child(3) { animation-delay: 0.15s; }
// .mobile-nav-item:nth-child(4) { animation-delay: 0.2s; }
// .mobile-nav-item:nth-child(5) { animation-delay: 0.25s; }
//
// .hamburger-active span:nth-child(1) {
//     transform: rotate(45deg) translate(5px, 5px);
// }
//
// .hamburger-active span:nth-child(2) {
//     opacity: 0;
// }
//
// .hamburger-active span:nth-child(3) {
//     transform: rotate(-45deg) translate(7px, -6px);
// }
//
// .hamburger span {
//     transition: all 0.3s ease;
// }
//     `,
//     jsCode: `
// (function() {
//     // Mobile menu toggle
//     const hamburger = document.getElementById('hamburger-btn');
//     const mobileMenu = document.getElementById('mobile-menu');
//     const mobileMenuOverlay = document.getElementById('mobile-overlay');
//     const body = document.body;
//
//     function toggleMenu(show) {
//         if (show === undefined) {
//             const isOpen = mobileMenu.classList.contains('active');
//             show = !isOpen;
//         }
//
//         if (show) {
//             mobileMenu.classList.add('active');
//             mobileMenuOverlay.classList.add('active');
//             body.style.overflow = 'hidden';
//             hamburger.classList.add('hamburger-active');
//         } else {
//             mobileMenu.classList.remove('active');
//             mobileMenuOverlay.classList.remove('active');
//             body.style.overflow = '';
//             hamburger.classList.remove('hamburger-active');
//         }
//     }
//
//     if (hamburger) {
//         hamburger.addEventListener('click', function(e) {
//             e.stopPropagation();
//             toggleMenu();
//         });
//     }
//
//     // Close menu when clicking overlay
//     if (mobileMenuOverlay) {
//         mobileMenuOverlay.addEventListener('click', function() {
//             toggleMenu(false);
//         });
//     }
//
//     // Close menu when clicking a link
//     document.querySelectorAll('.mobile-nav-link').forEach(function(link) {
//         link.addEventListener('click', function() {
//             toggleMenu(false);
//         });
//     });
//
//     // Handle scroll for sticky class
//     const nav = document.querySelector('.nav-aurora');
//     if (nav && {{isSticky}}) {
//         window.addEventListener('scroll', function() {
//             if (window.scrollY > 10) {
//                 nav.classList.add('scrolled');
//                 nav.style.boxShadow = '0 4px 20px rgba(0,0,0,0.05)';
//             } else {
//                 nav.classList.remove('scrolled');
//                 nav.style.boxShadow = 'none';
//             }
//         });
//     }
//
//     // Close mobile menu on window resize if open
//     window.addEventListener('resize', function() {
//         if (window.innerWidth >= 768 && mobileMenu && mobileMenu.classList.contains('active')) {
//             toggleMenu(false);
//         }
//     });
// })();
//     `,
//     htmlTemplate: `
// {{#isSticky}}<div class="sticky top-0 z-50">{{/isSticky}}
// <nav class="nav-aurora {{#isSticky}}sticky{{/isSticky}} top-0 z-50 w-full" style="position:{{#isSticky}}sticky{{/isSticky}}{{^isSticky}}relative{{/isSticky}}">
//     <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//         <div class="flex items-center justify-between h-16 lg:h-20">
//             <!-- Logo -->
//             <div class="flex items-center gap-2 z-10">
//                 {{#logoUrl}}
//                 <a href="/" class="flex items-center gap-2">
//                     <img src="{{logoUrl}}" alt="{{logoText}}" class="h-8 lg:h-10 w-auto object-contain transition-transform hover:scale-105 duration-300"/>
//                 </a>
//                 {{/logoUrl}}
//                 {{^logoUrl}}
//                 <a href="/" class="group flex items-center gap-2">
//                     <div class="w-8 h-8 lg:w-10 lg:h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg animate-[float_3s_ease-in-out_infinite]">
//                         <span class="text-white font-bold text-sm lg:text-base">✨</span>
//                     </div>
//                     <span class="font-black text-lg lg:text-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent group-hover:opacity-80 transition-opacity">{{logoText}}</span>
//                 </a>
//                 {{/logoUrl}}
//             </div>
//
//             <!-- Desktop Navigation -->
//             <div class="hidden md:flex items-center gap-1 lg:gap-2">
//                 {{#navLinks}}
//                 <a href="{{href}}" class="nav-link px-3 lg:px-4 py-2 text-sm lg:text-base font-medium text-gray-700 hover:text-gray-900 transition-all whitespace-nowrap">
//                     {{label}}
//                 </a>
//                 {{/navLinks}}
//             </div>
//
//             <!-- Desktop CTA & Hamburger -->
//             <div class="flex items-center gap-3 z-10">
//                 {{#ctaLabel}}
//                 <a href="{{ctaHref}}" class="hidden md:inline-flex px-5 lg:px-6 py-2 lg:py-2.5 rounded-full text-sm lg:text-base font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-size-200 animate-[aurora_6s_ease_infinite]">
//                     {{ctaLabel}}
//                 </a>
//                 {{/ctaLabel}}
//
//                 <!-- Mobile Hamburger Button -->
//                 <button id="hamburger-btn" class="hamburger md:hidden relative w-10 h-10 rounded-lg flex flex-col items-center justify-center gap-1.5 bg-white/50 backdrop-blur-sm border border-white/30 hover:bg-white/70 transition-all z-20" aria-label="Menu">
//                     <span class="block w-5 h-0.5 bg-gray-800 rounded-full transition-all duration-300"></span>
//                     <span class="block w-5 h-0.5 bg-gray-800 rounded-full transition-all duration-300"></span>
//                     <span class="block w-5 h-0.5 bg-gray-800 rounded-full transition-all duration-300"></span>
//                 </button>
//             </div>
//         </div>
//     </div>
// </nav>
//
// <!-- Mobile Menu Overlay -->
// <div id="mobile-overlay" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 opacity-0 invisible transition-all duration-300 md:hidden"></div>
//
// <!-- Mobile Menu Panel -->
// <div id="mobile-menu" class="fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white/95 backdrop-blur-xl z-50 transform translate-x-full transition-transform duration-300 ease-out shadow-2xl md:hidden">
//     <div class="flex flex-col h-full">
//         <div class="flex justify-end p-4">
//             <button id="close-mobile" class="p-2 rounded-full hover:bg-gray-100 transition-colors" aria-label="Close menu">
//                 <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
//                 </svg>
//             </button>
//         </div>
//         <div class="flex-1 px-6 py-4">
//             <div class="mb-6 pb-6 border-b border-gray-100">
//                 <div class="flex items-center gap-2">
//                     {{#logoUrl}}
//                     <img src="{{logoUrl}}" alt="{{logoText}}" class="h-8 w-auto"/>
//                     {{/logoUrl}}
//                     {{^logoUrl}}
//                     <div class="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
//                         <span class="text-white font-bold text-sm">✨</span>
//                     </div>
//                     <span class="font-black text-lg bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">{{logoText}}</span>
//                     {{/logoUrl}}
//                 </div>
//             </div>
//             <div class="space-y-1">
//                 {{#navLinks}}
//                 <a href="{{href}}" class="mobile-nav-item mobile-nav-link block px-4 py-3 rounded-xl text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-all">
//                     {{label}}
//                 </a>
//                 {{/navLinks}}
//             </div>
//         </div>
//         <div class="p-6 border-t border-gray-100">
//             {{#ctaLabel}}
//             <a href="{{ctaHref}}" class="mobile-nav-link block w-full text-center px-5 py-3 rounded-xl text-base font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
//                 {{ctaLabel}}
//             </a>
//             {{/ctaLabel}}
//         </div>
//     </div>
// </div>
// {{#isSticky}}</div>{{/isSticky}}
//
// <style>
// .bg-size-200 {
//     background-size: 200% 200%;
// }
// </style>
// `
// };
//
// // ─────────────────────────────────────────────────────────────────────────────
// // ONE UNIQUE FOOTER — Modern Split with Newsletter & Social Links
// // ─────────────────────────────────────────────────────────────────────────────
//
// const uniqueFooter = {
//     name: 'Footer — Gradient Wave',
//     key: 'footer_gradient_wave',
//     category: 'footer' as const,
//     description: 'Modern split footer with gradient wave design, newsletter signup, social links, and responsive multi-column layout.',
//     tags: ['gradient', 'wave', 'newsletter', 'social', 'modern', 'premium', 'responsive'],
//     siteTypes: ['all', 'saas', 'agency', 'portfolio', 'ecommerce', 'blog', 'restaurant'],
//     availableTo: ['free', 'silver', 'gold', 'diamond'],
//     isActive: true,
//     isFeatured: true,
//     isPremium: false,
//     previewImage: '',
//     propsSchema: [
//         {
//             key: 'brandName',
//             label: 'Brand Name',
//             type: 'text',
//             defaultValue: 'AURORA',
//             group: 'Brand'
//         },
//         {
//             key: 'tagline',
//             label: 'Tagline',
//             type: 'textarea',
//             defaultValue: 'Creating exceptional digital experiences that inspire and transform businesses worldwide.',
//             group: 'Brand'
//         },
//         {
//             key: 'newsletterEnabled',
//             label: 'Show Newsletter Section',
//             type: 'boolean',
//             defaultValue: true,
//             group: 'Newsletter'
//         },
//         {
//             key: 'newsletterTitle',
//             label: 'Newsletter Title',
//             type: 'text',
//             defaultValue: 'Stay in the loop',
//             group: 'Newsletter'
//         },
//         {
//             key: 'newsletterSubtext',
//             label: 'Newsletter Subtext',
//             type: 'text',
//             defaultValue: 'Get the latest updates and insights delivered to your inbox.',
//             group: 'Newsletter'
//         },
//         {
//             key: 'socialLinks',
//             label: 'Social Media Links',
//             type: 'array',
//             defaultValue: [
//                 {platform: 'Twitter', url: 'https://twitter.com', icon: '🐦'},
//                 {platform: 'LinkedIn', url: 'https://linkedin.com', icon: '🔗'},
//                 {platform: 'GitHub', url: 'https://github.com', icon: '🐙'},
//                 {platform: 'Instagram', url: 'https://instagram.com', icon: '📸'}
//             ],
//             arrayItemSchema: [
//                 {key: 'platform', label: 'Platform Name', type: 'text', defaultValue: ''},
//                 {key: 'url', label: 'Profile URL', type: 'url', defaultValue: '#'},
//                 {key: 'icon', label: 'Icon (emoji or text)', type: 'text', defaultValue: '🔗'}
//             ],
//             group: 'Social'
//         },
//         {
//             key: 'copyrightYear',
//             label: 'Copyright Year',
//             type: 'text',
//             defaultValue: new Date().getFullYear().toString(),
//             group: 'Legal'
//         },
//         {
//             key: 'copyrightName',
//             label: 'Copyright Name',
//             type: 'text',
//             defaultValue: 'AURORA',
//             group: 'Legal'
//         },
//         {
//             key: 'gradientStart',
//             label: 'Gradient Start Color',
//             type: 'color',
//             defaultValue: '#1a1a2e',
//             group: 'Style'
//         },
//         {
//             key: 'gradientEnd',
//             label: 'Gradient End Color',
//             type: 'color',
//             defaultValue: '#16213e',
//             group: 'Style'
//         }
//     ],
//     cssCode: `
// @keyframes waveAnimation {
//     0% { transform: translateX(0) translateY(0); }
//     50% { transform: translateX(-25%) translateY(-10px); }
//     100% { transform: translateX(-50%) translateY(0); }
// }
//
// @keyframes floatSlow {
//     0%, 100% { transform: translateY(0px); }
//     50% { transform: translateY(-5px); }
// }
//
// .footer-gradient {
//     background: linear-gradient(135deg, var(--gradient-start, #1a1a2e), var(--gradient-end, #16213e));
//     position: relative;
//     overflow: hidden;
// }
//
// .footer-wave {
//     position: absolute;
//     top: 0;
//     left: 0;
//     width: 100%;
//     overflow: hidden;
//     line-height: 0;
// }
//
// .footer-wave svg {
//     position: relative;
//     display: block;
//     width: calc(100% + 1.3px);
//     height: 60px;
// }
//
// .social-icon {
//     transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
//     display: inline-flex;
//     align-items: center;
//     justify-content: center;
// }
//
// .social-icon:hover {
//     transform: translateY(-3px) scale(1.1);
//     filter: drop-shadow(0 4px 8px rgba(0,0,0,0.2));
// }
//
// .footer-link {
//     position: relative;
//     transition: all 0.2s ease;
// }
//
// .footer-link::before {
//     content: '→';
//     position: absolute;
//     left: -16px;
//     opacity: 0;
//     transition: all 0.2s ease;
// }
//
// .footer-link:hover {
//     padding-left: 20px;
// }
//
// .footer-link:hover::before {
//     opacity: 1;
//     left: 0;
// }
//
// .newsletter-input:focus {
//     outline: none;
//     box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.3);
// }
//
// @keyframes shimmer {
//     0% { background-position: -1000px 0; }
//     100% { background-position: 1000px 0; }
// }
//
// .newsletter-button {
//     background: linear-gradient(135deg, #6366f1, #a855f7);
//     background-size: 200% auto;
//     transition: all 0.3s ease;
// }
//
// .newsletter-button:hover {
//     background-position: right center;
//     transform: translateY(-1px);
// }
//     `,
//     jsCode: `
// (function() {
//     // Newsletter form handling
//     const newsletterForm = document.getElementById('newsletter-form-footer');
//     if (newsletterForm) {
//         newsletterForm.addEventListener('submit', function(e) {
//             e.preventDefault();
//             const emailInput = this.querySelector('input[type="email"]');
//             const email = emailInput.value;
//
//             if (!email) return;
//
//             const submitBtn = this.querySelector('button[type="submit"]');
//             const originalText = submitBtn.textContent;
//             submitBtn.disabled = true;
//             submitBtn.textContent = 'Subscribing...';
//
//             // Simulate API call - replace with actual endpoint
//             setTimeout(function() {
//                 const successDiv = document.createElement('div');
//                 successDiv.className = 'mt-3 text-center text-green-400 text-sm font-medium';
//                 successDiv.innerHTML = '✓ Thanks for subscribing! Check your inbox.';
//                 newsletterForm.parentNode.appendChild(successDiv);
//                 newsletterForm.style.display = 'none';
//
//                 submitBtn.disabled = false;
//                 submitBtn.textContent = originalText;
//             }, 1000);
//         });
//     }
//
//     // Add hover effect to social icons
//     document.querySelectorAll('.social-icon').forEach(function(icon) {
//         icon.addEventListener('mouseenter', function() {
//             this.style.animation = 'floatSlow 0.5s ease-in-out';
//         });
//         icon.addEventListener('mouseleave', function() {
//             this.style.animation = '';
//         });
//     });
//
//     // Add current year to copyright if not specified
//     const copyrightYear = document.querySelector('.copyright-year');
//     if (copyrightYear && (!copyrightYear.textContent || copyrightYear.textContent === '')) {
//         copyrightYear.textContent = new Date().getFullYear();
//     }
// })();
//     `,
//     htmlTemplate: `
// <footer class="footer-gradient relative mt-auto" style="--gradient-start:{{gradientStart}};--gradient-end:{{gradientEnd}}">
//     <!-- Wave Top Decoration -->
//     <div class="footer-wave">
//         <svg data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
//             <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
//                   fill="rgba(255,255,255,0.05)" class="shape-fill"></path>
//             <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
//                   fill="rgba(255,255,255,0.03)" class="shape-fill" transform="translate(0, 20)"></path>
//         </svg>
//     </div>
//
//     <div class="relative z-10">
//         <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
//             <!-- Main Footer Grid -->
//             <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 mb-12">
//
//                 <!-- Brand Column -->
//                 <div class="space-y-4">
//                     <div class="flex items-center gap-2">
//                         <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg animate-[floatSlow_3s_ease-in-out_infinite]">
//                             <span class="text-white font-bold text-lg">✨</span>
//                         </div>
//                         <h2 class="text-2xl lg:text-3xl font-black bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
//                             {{brandName}}
//                         </h2>
//                     </div>
//                     <p class="text-gray-300 leading-relaxed text-sm lg:text-base max-w-md">
//                         {{tagline}}
//                     </p>
//
//                     <!-- Social Links -->
//                     <div class="flex items-center gap-3 pt-2">
//                         {{#socialLinks}}
//                         <a href="{{url}}" target="_blank" rel="noopener noreferrer"
//                            class="social-icon w-9 h-9 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-all"
//                            aria-label="{{platform}}">
//                             <span class="text-lg">{{icon}}</span>
//                         </a>
//                         {{/socialLinks}}
//                     </div>
//                 </div>
//
//                 <!-- Newsletter Column -->
//                 {{#newsletterEnabled}}
//                 <div class="bg-white/5 backdrop-blur-sm rounded-2xl p-6 lg:p-8 border border-white/10">
//                     <h3 class="text-xl lg:text-2xl font-bold text-white mb-2">{{newsletterTitle}}</h3>
//                     <p class="text-gray-300 text-sm mb-5">{{newsletterSubtext}}</p>
//                     <form id="newsletter-form-footer" class="flex flex-col sm:flex-row gap-3">
//                         <input type="email"
//                                placeholder="Enter your email"
//                                required
//                                class="newsletter-input flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"/>
//                         <button type="submit"
//                                 class="newsletter-button px-6 py-3 rounded-xl text-white font-semibold text-sm shadow-lg transition-all hover:shadow-xl whitespace-nowrap">
//                             Subscribe
//                         </button>
//                     </form>
//                     <p class="text-xs text-gray-400 mt-3">No spam. Unsubscribe anytime.</p>
//                 </div>
//                 {{/newsletterEnabled}}
//             </div>
//
//             <!-- Footer Links Grid -->
//             <div class="grid grid-cols-2 md:grid-cols-4 gap-8 py-8 border-t border-white/10">
//                 <div>
//                     <h4 class="text-white font-semibold text-sm uppercase tracking-wider mb-4">Explore</h4>
//                     <ul class="space-y-2">
//                         <li><a href="/" class="footer-link text-gray-400 hover:text-white text-sm transition-colors inline-block">Home</a></li>
//                         <li><a href="/about" class="footer-link text-gray-400 hover:text-white text-sm transition-colors inline-block">About Us</a></li>
//                         <li><a href="/services" class="footer-link text-gray-400 hover:text-white text-sm transition-colors inline-block">Services</a></li>
//                         <li><a href="/pricing" class="footer-link text-gray-400 hover:text-white text-sm transition-colors inline-block">Pricing</a></li>
//                     </ul>
//                 </div>
//                 <div>
//                     <h4 class="text-white font-semibold text-sm uppercase tracking-wider mb-4">Resources</h4>
//                     <ul class="space-y-2">
//                         <li><a href="/blog" class="footer-link text-gray-400 hover:text-white text-sm transition-colors inline-block">Blog</a></li>
//                         <li><a href="/docs" class="footer-link text-gray-400 hover:text-white text-sm transition-colors inline-block">Documentation</a></li>
//                         <li><a href="/help" class="footer-link text-gray-400 hover:text-white text-sm transition-colors inline-block">Help Center</a></li>
//                         <li><a href="/community" class="footer-link text-gray-400 hover:text-white text-sm transition-colors inline-block">Community</a></li>
//                     </ul>
//                 </div>
//                 <div>
//                     <h4 class="text-white font-semibold text-sm uppercase tracking-wider mb-4">Company</h4>
//                     <ul class="space-y-2">
//                         <li><a href="/careers" class="footer-link text-gray-400 hover:text-white text-sm transition-colors inline-block">Careers</a></li>
//                         <li><a href="/press" class="footer-link text-gray-400 hover:text-white text-sm transition-colors inline-block">Press Kit</a></li>
//                         <li><a href="/contact" class="footer-link text-gray-400 hover:text-white text-sm transition-colors inline-block">Contact</a></li>
//                         <li><a href="/partners" class="footer-link text-gray-400 hover:text-white text-sm transition-colors inline-block">Partners</a></li>
//                     </ul>
//                 </div>
//                 <div>
//                     <h4 class="text-white font-semibold text-sm uppercase tracking-wider mb-4">Legal</h4>
//                     <ul class="space-y-2">
//                         <li><a href="/privacy" class="footer-link text-gray-400 hover:text-white text-sm transition-colors inline-block">Privacy Policy</a></li>
//                         <li><a href="/terms" class="footer-link text-gray-400 hover:text-white text-sm transition-colors inline-block">Terms of Service</a></li>
//                         <li><a href="/cookies" class="footer-link text-gray-400 hover:text-white text-sm transition-colors inline-block">Cookie Policy</a></li>
//                         <li><a href="/security" class="footer-link text-gray-400 hover:text-white text-sm transition-colors inline-block">Security</a></li>
//                     </ul>
//                 </div>
//             </div>
//
//             <!-- Copyright Bar -->
//             <div class="border-t border-white/10 pt-6 mt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
//                 <p class="text-gray-400 text-xs">
//                     © <span class="copyright-year">{{copyrightYear}}</span> {{copyrightName}}. All rights reserved.
//                 </p>
//                 <div class="flex items-center gap-4 text-xs text-gray-400">
//                     <a href="/accessibility" class="hover:text-white transition-colors">Accessibility</a>
//                     <span>•</span>
//                     <a href="/sitemap" class="hover:text-white transition-colors">Sitemap</a>
//                 </div>
//             </div>
//         </div>
//     </div>
// </footer>
// `
// };
//
// // ─────────────────────────────────────────────────────────────────────────────
// // Seed Runner
// // ─────────────────────────────────────────────────────────────────────────────
//
// async function seed() {
//     console.log('🚀 Starting component seed...\n');
//     console.log('Connecting to MongoDB...');
//     await mongoose.connect(MONGODB_URI!);
//     console.log('✅ Connected to database\n');
//
//     let inserted = 0;
//     let updated = 0;
//
//     // Seed Navbar
//     console.log('📦 Seeding Navbar Component...');
//     const navbarResult = await PlanComponentModel.findOneAndUpdate(
//         {key: uniqueNavbar.key},
//         {$set: uniqueNavbar},
//         {upsert: true, new: true, setDefaultsOnInsert: true}
//     );
//     const isNavbarNew = navbarResult.createdAt.getTime() === navbarResult.updatedAt.getTime();
//     if (isNavbarNew) {
//         inserted++;
//         console.log(`  ✨ Created: ${uniqueNavbar.name} (${uniqueNavbar.key})`);
//     } else {
//         updated++;
//         console.log(`  🔄 Updated: ${uniqueNavbar.name} (${uniqueNavbar.key})`);
//     }
//
//     // Seed Footer
//     console.log('\n📦 Seeding Footer Component...');
//     const footerResult = await PlanComponentModel.findOneAndUpdate(
//         {key: uniqueFooter.key},
//         {$set: uniqueFooter},
//         {upsert: true, new: true, setDefaultsOnInsert: true}
//     );
//     const isFooterNew = footerResult.createdAt.getTime() === footerResult.updatedAt.getTime();
//     if (isFooterNew) {
//         inserted++;
//         console.log(`  ✨ Created: ${uniqueFooter.name} (${uniqueFooter.key})`);
//     } else {
//         updated++;
//         console.log(`  🔄 Updated: ${uniqueFooter.name} (${uniqueFooter.key})`);
//     }
//
//     console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
//     console.log(`✅ Seeding Complete!`);
//     console.log(`   📦 ${inserted} component(s) created`);
//     console.log(`   🔄 ${updated} component(s) updated`);
//     console.log(`   📊 Total: 2 component(s) in database`);
//     console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
//
//     console.log('📋 Component Details:');
//     console.log(`   • Navbar Key: ${uniqueNavbar.key}`);
//     console.log(`   • Footer Key: ${uniqueFooter.key}`);
//     console.log('\n💡 You can now use these components in your site builder!');
//     console.log('   To preview, visit your component library in Super Admin.\n');
//
//     await mongoose.disconnect();
//     console.log('🔌 Disconnected from MongoDB');
// }
//
// seed().catch((err) => {
//     console.error('❌ Seed failed:', err);
//     process.exit(1);
// });