/**
 * lib/builder/presets.ts
 *
 * When a user picks a site type (blog, portfolio, saas, etc.) for the first time,
 * we pre-fill their UserSite with a sensible starter page structure.
 * Component keys here must match PlanComponent.key values you create in super admin.
 */

import {v4 as uuid} from "uuid";
import type {IUserPage, SiteType} from "@/models/UserSite";

interface StarterPreset {
    siteType: SiteType;
    label: string;
    emoji: string;
    description: string;
    suggestedSiteName: string;
    defaultTheme: {
        primaryColor: string;
        secondaryColor: string;
        accentColor: string;
        backgroundColor: string;
        textColor: string;
        fontHeading: string;
        fontBody: string;
        borderRadius: "none" | "sm" | "md" | "lg" | "full";
        shadowStyle: "none" | "sm" | "md" | "lg";
        darkMode: boolean;
    };
    pages: Omit<IUserPage, "components" | "createdAt" | "updatedAt">[];
    // Component keys that should be pre-placed on the home page
    // Super admin creates these; keys must exist in DB
    homePageComponentKeys: string[];
    navbarComponentKey: string;
    footerComponentKey: string;
}

export const SITE_PRESETS: StarterPreset[] = [
    {
        siteType: "blog",
        label: "Blog",
        emoji: "✍️",
        description: "A clean, readable blog with posts, categories, and newsletter signup.",
        suggestedSiteName: "My Blog",
        defaultTheme: {
            primaryColor: "#2563EB",
            secondaryColor: "#7C3AED",
            accentColor: "#F59E0B",
            backgroundColor: "#FAFAF9",
            textColor: "#1C1917",
            fontHeading: "Playfair Display",
            fontBody: "Source Serif 4",
            borderRadius: "sm",
            shadowStyle: "sm",
            darkMode: false,
        },
        navbarComponentKey: "navbar_minimal_light",
        footerComponentKey: "footer_simple_blog",
        homePageComponentKeys: [
            "hero_blog_header",
            "section_featured_posts",
            "section_categories_grid",
            "widget_newsletter_signup",
        ],
        pages: [
            {
                pageId: uuid(),
                slug: "/",
                title: "Home",
                role: "home",
                isEnabled: true,
                isHomePage: true,
                showInNav: false,
                seo: {}
            },
            {
                pageId: uuid(),
                slug: "/blog",
                title: "Blog",
                role: "blog",
                isEnabled: true,
                isHomePage: false,
                showInNav: true,
                seo: {}
            },
            {
                pageId: uuid(),
                slug: "/about",
                title: "About",
                role: "about",
                isEnabled: true,
                isHomePage: false,
                showInNav: true,
                seo: {}
            },
            {
                pageId: uuid(),
                slug: "/contact",
                title: "Contact",
                role: "contact",
                isEnabled: true,
                isHomePage: false,
                showInNav: true,
                seo: {}
            },
        ],
    },
    {
        siteType: "portfolio",
        label: "Portfolio",
        emoji: "🎨",
        description: "Showcase your work with a stunning portfolio and case studies.",
        suggestedSiteName: "My Portfolio",
        defaultTheme: {
            primaryColor: "#0F172A",
            secondaryColor: "#6366F1",
            accentColor: "#EC4899",
            backgroundColor: "#FFFFFF",
            textColor: "#0F172A",
            fontHeading: "Syne",
            fontBody: "DM Sans",
            borderRadius: "none",
            shadowStyle: "none",
            darkMode: false,
        },
        navbarComponentKey: "navbar_portfolio_minimal",
        footerComponentKey: "footer_portfolio_dark",
        homePageComponentKeys: [
            "hero_portfolio_fullscreen",
            "section_portfolio_grid",
            "section_skills_showcase",
            "section_testimonials_carousel",
            "widget_contact_form_minimal",
        ],
        pages: [
            {
                pageId: uuid(),
                slug: "/",
                title: "Home",
                role: "home",
                isEnabled: true,
                isHomePage: true,
                showInNav: false,
                seo: {}
            },
            {
                pageId: uuid(),
                slug: "/work",
                title: "Work",
                role: "portfolio",
                isEnabled: true,
                isHomePage: false,
                showInNav: true,
                seo: {}
            },
            {
                pageId: uuid(),
                slug: "/about",
                title: "About",
                role: "about",
                isEnabled: true,
                isHomePage: false,
                showInNav: true,
                seo: {}
            },
            {
                pageId: uuid(),
                slug: "/contact",
                title: "Contact",
                role: "contact",
                isEnabled: true,
                isHomePage: false,
                showInNav: true,
                seo: {}
            },
        ],
    },
    {
        siteType: "saas",
        label: "SaaS / Startup",
        emoji: "🚀",
        description: "Convert visitors into customers with a professional SaaS landing page.",
        suggestedSiteName: "My SaaS",
        defaultTheme: {
            primaryColor: "#4F46E5",
            secondaryColor: "#0EA5E9",
            accentColor: "#22C55E",
            backgroundColor: "#FFFFFF",
            textColor: "#111827",
            fontHeading: "Plus Jakarta Sans",
            fontBody: "Inter",
            borderRadius: "lg",
            shadowStyle: "lg",
            darkMode: false,
        },
        navbarComponentKey: "navbar_saas_with_cta",
        footerComponentKey: "footer_saas_full",
        homePageComponentKeys: [
            "hero_saas_gradient",
            "section_social_proof_logos",
            "section_features_three_column",
            "section_how_it_works_steps",
            "section_pricing_table",
            "section_testimonials_grid",
            "section_faq_accordion",
            "section_cta_fullwidth",
        ],
        pages: [
            {
                pageId: uuid(),
                slug: "/",
                title: "Home",
                role: "home",
                isEnabled: true,
                isHomePage: true,
                showInNav: false,
                seo: {}
            },
            {
                pageId: uuid(),
                slug: "/features",
                title: "Features",
                role: "custom",
                isEnabled: true,
                isHomePage: false,
                showInNav: true,
                seo: {}
            },
            {
                pageId: uuid(),
                slug: "/pricing",
                title: "Pricing",
                role: "pricing",
                isEnabled: true,
                isHomePage: false,
                showInNav: true,
                seo: {}
            },
            {
                pageId: uuid(),
                slug: "/blog",
                title: "Blog",
                role: "blog",
                isEnabled: true,
                isHomePage: false,
                showInNav: true,
                seo: {}
            },
            {
                pageId: uuid(),
                slug: "/contact",
                title: "Contact",
                role: "contact",
                isEnabled: true,
                isHomePage: false,
                showInNav: true,
                seo: {}
            },
        ],
    },
    {
        siteType: "ecommerce",
        label: "eCommerce / Shop",
        emoji: "🛍️",
        description: "Sell products with a beautiful shop front, product grids, and checkout.",
        suggestedSiteName: "My Shop",
        defaultTheme: {
            primaryColor: "#BE185D",
            secondaryColor: "#9333EA",
            accentColor: "#F59E0B",
            backgroundColor: "#FFF7F0",
            textColor: "#1A1A1A",
            fontHeading: "Fraunces",
            fontBody: "Nunito",
            borderRadius: "md",
            shadowStyle: "md",
            darkMode: false,
        },
        navbarComponentKey: "navbar_shop_with_cart",
        footerComponentKey: "footer_shop_full",
        homePageComponentKeys: [
            "hero_shop_banner",
            "section_featured_products",
            "section_categories_shop",
            "section_bestsellers_grid",
            "widget_newsletter_discount",
        ],
        pages: [
            {
                pageId: uuid(),
                slug: "/",
                title: "Home",
                role: "home",
                isEnabled: true,
                isHomePage: true,
                showInNav: false,
                seo: {}
            },
            {
                pageId: uuid(),
                slug: "/shop",
                title: "Shop",
                role: "shop",
                isEnabled: true,
                isHomePage: false,
                showInNav: true,
                seo: {}
            },
            {
                pageId: uuid(),
                slug: "/about",
                title: "About",
                role: "about",
                isEnabled: true,
                isHomePage: false,
                showInNav: true,
                seo: {}
            },
            {
                pageId: uuid(),
                slug: "/contact",
                title: "Contact",
                role: "contact",
                isEnabled: true,
                isHomePage: false,
                showInNav: true,
                seo: {}
            },
        ],
    },
    {
        siteType: "restaurant",
        label: "Restaurant / Food",
        emoji: "🍽️",
        description: "A stunning restaurant website with menu, reservations, and gallery.",
        suggestedSiteName: "My Restaurant",
        defaultTheme: {
            primaryColor: "#92400E",
            secondaryColor: "#B45309",
            accentColor: "#DC2626",
            backgroundColor: "#FFFBEB",
            textColor: "#1C1917",
            fontHeading: "Cormorant Garamond",
            fontBody: "Lato",
            borderRadius: "sm",
            shadowStyle: "md",
            darkMode: false,
        },
        navbarComponentKey: "navbar_restaurant_elegant",
        footerComponentKey: "footer_restaurant",
        homePageComponentKeys: [
            "hero_restaurant_fullscreen",
            "section_restaurant_menu_preview",
            "section_photo_gallery_masonry",
            "widget_reservation_form",
            "section_restaurant_story",
        ],
        pages: [
            {
                pageId: uuid(),
                slug: "/",
                title: "Home",
                role: "home",
                isEnabled: true,
                isHomePage: true,
                showInNav: false,
                seo: {}
            },
            {
                pageId: uuid(),
                slug: "/menu",
                title: "Menu",
                role: "custom",
                isEnabled: true,
                isHomePage: false,
                showInNav: true,
                seo: {}
            },
            {
                pageId: uuid(),
                slug: "/gallery",
                title: "Gallery",
                role: "custom",
                isEnabled: true,
                isHomePage: false,
                showInNav: true,
                seo: {}
            },
            {
                pageId: uuid(),
                slug: "/reservations",
                title: "Reservations",
                role: "contact",
                isEnabled: true,
                isHomePage: false,
                showInNav: true,
                seo: {}
            },
        ],
    },
    {
        siteType: "agency",
        label: "Agency / Studio",
        emoji: "💼",
        description: "Bold agency site showcasing services, team, and case studies.",
        suggestedSiteName: "My Agency",
        defaultTheme: {
            primaryColor: "#111827",
            secondaryColor: "#6366F1",
            accentColor: "#10B981",
            backgroundColor: "#FFFFFF",
            textColor: "#111827",
            fontHeading: "Cabinet Grotesk",
            fontBody: "General Sans",
            borderRadius: "none",
            shadowStyle: "none",
            darkMode: false,
        },
        navbarComponentKey: "navbar_agency_bold",
        footerComponentKey: "footer_agency_dark",
        homePageComponentKeys: [
            "hero_agency_bold",
            "section_services_agency",
            "section_case_studies_grid",
            "section_team_grid",
            "section_client_logos",
            "section_cta_agency",
        ],
        pages: [
            {
                pageId: uuid(),
                slug: "/",
                title: "Home",
                role: "home",
                isEnabled: true,
                isHomePage: true,
                showInNav: false,
                seo: {}
            },
            {
                pageId: uuid(),
                slug: "/work",
                title: "Work",
                role: "portfolio",
                isEnabled: true,
                isHomePage: false,
                showInNav: true,
                seo: {}
            },
            {
                pageId: uuid(),
                slug: "/services",
                title: "Services",
                role: "custom",
                isEnabled: true,
                isHomePage: false,
                showInNav: true,
                seo: {}
            },
            {
                pageId: uuid(),
                slug: "/team",
                title: "Team",
                role: "about",
                isEnabled: true,
                isHomePage: false,
                showInNav: true,
                seo: {}
            },
            {
                pageId: uuid(),
                slug: "/contact",
                title: "Contact",
                role: "contact",
                isEnabled: true,
                isHomePage: false,
                showInNav: true,
                seo: {}
            },
        ],
    },
];

export function getPreset(siteType: SiteType): StarterPreset | undefined {
    return SITE_PRESETS.find((p) => p.siteType === siteType);
}

// /**
//  * lib/builder/presets.ts
//  *
//  * When a user picks a site type (blog, portfolio, saas, etc.) for the first time,
//  * we pre-fill their UserSite with a sensible starter page structure.
//  * Component keys here must match PlanComponent.key values you create in super admin.
//  */
//
// import {v4 as uuid} from "uuid";
// import type {IUserPage, SiteType} from "@/models/UserSite";
//
// interface StarterPreset {
//     siteType: SiteType;
//     label: string;
//     emoji: string;
//     description: string;
//     suggestedSiteName: string;
//     defaultTheme: {
//         primaryColor: string;
//         secondaryColor: string;
//         accentColor: string;
//         backgroundColor: string;
//         textColor: string;
//         fontHeading: string;
//         fontBody: string;
//         borderRadius: "none" | "sm" | "md" | "lg" | "full";
//         shadowStyle: "none" | "sm" | "md" | "lg";
//         darkMode: boolean;
//     };
//     pages: Omit<IUserPage, "components" | "createdAt" | "updatedAt">[];
//     // Component keys that should be pre-placed on the home page
//     // Super admin creates these; keys must exist in DB
//     homePageComponentKeys: string[];
//     navbarComponentKey: string;
//     footerComponentKey: string;
// }
//
// export const SITE_PRESETS: StarterPreset[] = [
//     {
//         siteType: "blog",
//         label: "Blog",
//         emoji: "✍️",
//         description: "A clean, readable blog with posts, categories, and newsletter signup.",
//         suggestedSiteName: "My Blog",
//         defaultTheme: {
//             primaryColor: "#2563EB",
//             secondaryColor: "#7C3AED",
//             accentColor: "#F59E0B",
//             backgroundColor: "#FAFAF9",
//             textColor: "#1C1917",
//             fontHeading: "Playfair Display",
//             fontBody: "Source Serif 4",
//             borderRadius: "sm",
//             shadowStyle: "sm",
//             darkMode: false,
//         },
//         navbarComponentKey: "navbar_minimal_light",
//         footerComponentKey: "footer_simple_blog",
//         homePageComponentKeys: [
//             "hero_blog_header",
//             "section_featured_posts",
//             "section_categories_grid",
//             "widget_newsletter_signup",
//         ],
//         pages: [
//             {
//                 pageId: uuid(),
//                 slug: "/",
//                 title: "Home",
//                 role: "home",
//                 isEnabled: true,
//                 isHomePage: true,
//                 showInNav: false,
//                 seo: {}
//             },
//             {
//                 pageId: uuid(),
//                 slug: "/blog",
//                 title: "Blog",
//                 role: "blog",
//                 isEnabled: true,
//                 isHomePage: false,
//                 showInNav: true,
//                 seo: {}
//             },
//             {
//                 pageId: uuid(),
//                 slug: "/about",
//                 title: "About",
//                 role: "about",
//                 isEnabled: true,
//                 isHomePage: false,
//                 showInNav: true,
//                 seo: {}
//             },
//             {
//                 pageId: uuid(),
//                 slug: "/contact",
//                 title: "Contact",
//                 role: "contact",
//                 isEnabled: true,
//                 isHomePage: false,
//                 showInNav: true,
//                 seo: {}
//             },
//         ],
//     },
//     {
//         siteType: "portfolio",
//         label: "Portfolio",
//         emoji: "🎨",
//         description: "Showcase your work with a stunning portfolio and case studies.",
//         suggestedSiteName: "My Portfolio",
//         defaultTheme: {
//             primaryColor: "#0F172A",
//             secondaryColor: "#6366F1",
//             accentColor: "#EC4899",
//             backgroundColor: "#FFFFFF",
//             textColor: "#0F172A",
//             fontHeading: "Syne",
//             fontBody: "DM Sans",
//             borderRadius: "none",
//             shadowStyle: "none",
//             darkMode: false,
//         },
//         navbarComponentKey: "navbar_portfolio_minimal",
//         footerComponentKey: "footer_portfolio_dark",
//         homePageComponentKeys: [
//             "hero_portfolio_fullscreen",
//             "section_portfolio_grid",
//             "section_skills_showcase",
//             "section_testimonials_carousel",
//             "widget_contact_form_minimal",
//         ],
//         pages: [
//             {
//                 pageId: uuid(),
//                 slug: "/",
//                 title: "Home",
//                 role: "home",
//                 isEnabled: true,
//                 isHomePage: true,
//                 showInNav: false,
//                 seo: {}
//             },
//             {
//                 pageId: uuid(),
//                 slug: "/work",
//                 title: "Work",
//                 role: "portfolio",
//                 isEnabled: true,
//                 isHomePage: false,
//                 showInNav: true,
//                 seo: {}
//             },
//             {
//                 pageId: uuid(),
//                 slug: "/about",
//                 title: "About",
//                 role: "about",
//                 isEnabled: true,
//                 isHomePage: false,
//                 showInNav: true,
//                 seo: {}
//             },
//             {
//                 pageId: uuid(),
//                 slug: "/contact",
//                 title: "Contact",
//                 role: "contact",
//                 isEnabled: true,
//                 isHomePage: false,
//                 showInNav: true,
//                 seo: {}
//             },
//         ],
//     },
//     {
//         siteType: "saas",
//         label: "SaaS / Startup",
//         emoji: "🚀",
//         description: "Convert visitors into customers with a professional SaaS landing page.",
//         suggestedSiteName: "My SaaS",
//         defaultTheme: {
//             primaryColor: "#4F46E5",
//             secondaryColor: "#0EA5E9",
//             accentColor: "#22C55E",
//             backgroundColor: "#FFFFFF",
//             textColor: "#111827",
//             fontHeading: "Plus Jakarta Sans",
//             fontBody: "Inter",
//             borderRadius: "lg",
//             shadowStyle: "lg",
//             darkMode: false,
//         },
//         navbarComponentKey: "navbar_saas_with_cta",
//         footerComponentKey: "footer_saas_full",
//         homePageComponentKeys: [
//             "hero_saas_gradient",
//             "section_social_proof_logos",
//             "section_features_three_column",
//             "section_how_it_works_steps",
//             "section_pricing_table",
//             "section_testimonials_grid",
//             "section_faq_accordion",
//             "section_cta_fullwidth",
//         ],
//         pages: [
//             {
//                 pageId: uuid(),
//                 slug: "/",
//                 title: "Home",
//                 role: "home",
//                 isEnabled: true,
//                 isHomePage: true,
//                 showInNav: false,
//                 seo: {}
//             },
//             {
//                 pageId: uuid(),
//                 slug: "/features",
//                 title: "Features",
//                 role: "custom",
//                 isEnabled: true,
//                 isHomePage: false,
//                 showInNav: true,
//                 seo: {}
//             },
//             {
//                 pageId: uuid(),
//                 slug: "/pricing",
//                 title: "Pricing",
//                 role: "pricing",
//                 isEnabled: true,
//                 isHomePage: false,
//                 showInNav: true,
//                 seo: {}
//             },
//             {
//                 pageId: uuid(),
//                 slug: "/blog",
//                 title: "Blog",
//                 role: "blog",
//                 isEnabled: true,
//                 isHomePage: false,
//                 showInNav: true,
//                 seo: {}
//             },
//             {
//                 pageId: uuid(),
//                 slug: "/contact",
//                 title: "Contact",
//                 role: "contact",
//                 isEnabled: true,
//                 isHomePage: false,
//                 showInNav: true,
//                 seo: {}
//             },
//         ],
//     },
//     {
//         siteType: "ecommerce",
//         label: "eCommerce / Shop",
//         emoji: "🛍️",
//         description: "Sell products with a beautiful shop front, product grids, and checkout.",
//         suggestedSiteName: "My Shop",
//         defaultTheme: {
//             primaryColor: "#BE185D",
//             secondaryColor: "#9333EA",
//             accentColor: "#F59E0B",
//             backgroundColor: "#FFF7F0",
//             textColor: "#1A1A1A",
//             fontHeading: "Fraunces",
//             fontBody: "Nunito",
//             borderRadius: "md",
//             shadowStyle: "md",
//             darkMode: false,
//         },
//         navbarComponentKey: "navbar_shop_with_cart",
//         footerComponentKey: "footer_shop_full",
//         homePageComponentKeys: [
//             "hero_shop_banner",
//             "section_featured_products",
//             "section_categories_shop",
//             "section_bestsellers_grid",
//             "widget_newsletter_discount",
//         ],
//         pages: [
//             {
//                 pageId: uuid(),
//                 slug: "/",
//                 title: "Home",
//                 role: "home",
//                 isEnabled: true,
//                 isHomePage: true,
//                 showInNav: false,
//                 seo: {}
//             },
//             {
//                 pageId: uuid(),
//                 slug: "/shop",
//                 title: "Shop",
//                 role: "shop",
//                 isEnabled: true,
//                 isHomePage: false,
//                 showInNav: true,
//                 seo: {}
//             },
//             {
//                 pageId: uuid(),
//                 slug: "/about",
//                 title: "About",
//                 role: "about",
//                 isEnabled: true,
//                 isHomePage: false,
//                 showInNav: true,
//                 seo: {}
//             },
//             {
//                 pageId: uuid(),
//                 slug: "/contact",
//                 title: "Contact",
//                 role: "contact",
//                 isEnabled: true,
//                 isHomePage: false,
//                 showInNav: true,
//                 seo: {}
//             },
//         ],
//     },
//     {
//         siteType: "restaurant",
//         label: "Restaurant / Food",
//         emoji: "🍽️",
//         description: "A stunning restaurant website with menu, reservations, and gallery.",
//         suggestedSiteName: "My Restaurant",
//         defaultTheme: {
//             primaryColor: "#92400E",
//             secondaryColor: "#B45309",
//             accentColor: "#DC2626",
//             backgroundColor: "#FFFBEB",
//             textColor: "#1C1917",
//             fontHeading: "Cormorant Garamond",
//             fontBody: "Lato",
//             borderRadius: "sm",
//             shadowStyle: "md",
//             darkMode: false,
//         },
//         navbarComponentKey: "navbar_restaurant_elegant",
//         footerComponentKey: "footer_restaurant",
//         homePageComponentKeys: [
//             "hero_restaurant_fullscreen",
//             "section_restaurant_menu_preview",
//             "section_photo_gallery_masonry",
//             "widget_reservation_form",
//             "section_restaurant_story",
//         ],
//         pages: [
//             {
//                 pageId: uuid(),
//                 slug: "/",
//                 title: "Home",
//                 role: "home",
//                 isEnabled: true,
//                 isHomePage: true,
//                 showInNav: false,
//                 seo: {}
//             },
//             {
//                 pageId: uuid(),
//                 slug: "/menu",
//                 title: "Menu",
//                 role: "custom",
//                 isEnabled: true,
//                 isHomePage: false,
//                 showInNav: true,
//                 seo: {}
//             },
//             {
//                 pageId: uuid(),
//                 slug: "/gallery",
//                 title: "Gallery",
//                 role: "custom",
//                 isEnabled: true,
//                 isHomePage: false,
//                 showInNav: true,
//                 seo: {}
//             },
//             {
//                 pageId: uuid(),
//                 slug: "/reservations",
//                 title: "Reservations",
//                 role: "contact",
//                 isEnabled: true,
//                 isHomePage: false,
//                 showInNav: true,
//                 seo: {}
//             },
//         ],
//     },
//     {
//         siteType: "agency",
//         label: "Agency / Studio",
//         emoji: "💼",
//         description: "Bold agency site showcasing services, team, and case studies.",
//         suggestedSiteName: "My Agency",
//         defaultTheme: {
//             primaryColor: "#111827",
//             secondaryColor: "#6366F1",
//             accentColor: "#10B981",
//             backgroundColor: "#FFFFFF",
//             textColor: "#111827",
//             fontHeading: "Cabinet Grotesk",
//             fontBody: "General Sans",
//             borderRadius: "none",
//             shadowStyle: "none",
//             darkMode: false,
//         },
//         navbarComponentKey: "navbar_agency_bold",
//         footerComponentKey: "footer_agency_dark",
//         homePageComponentKeys: [
//             "hero_agency_bold",
//             "section_services_agency",
//             "section_case_studies_grid",
//             "section_team_grid",
//             "section_client_logos",
//             "section_cta_agency",
//         ],
//         pages: [
//             {
//                 pageId: uuid(),
//                 slug: "/",
//                 title: "Home",
//                 role: "home",
//                 isEnabled: true,
//                 isHomePage: true,
//                 showInNav: false,
//                 seo: {}
//             },
//             {
//                 pageId: uuid(),
//                 slug: "/work",
//                 title: "Work",
//                 role: "portfolio",
//                 isEnabled: true,
//                 isHomePage: false,
//                 showInNav: true,
//                 seo: {}
//             },
//             {
//                 pageId: uuid(),
//                 slug: "/services",
//                 title: "Services",
//                 role: "custom",
//                 isEnabled: true,
//                 isHomePage: false,
//                 showInNav: true,
//                 seo: {}
//             },
//             {
//                 pageId: uuid(),
//                 slug: "/team",
//                 title: "Team",
//                 role: "about",
//                 isEnabled: true,
//                 isHomePage: false,
//                 showInNav: true,
//                 seo: {}
//             },
//             {
//                 pageId: uuid(),
//                 slug: "/contact",
//                 title: "Contact",
//                 role: "contact",
//                 isEnabled: true,
//                 isHomePage: false,
//                 showInNav: true,
//                 seo: {}
//             },
//         ],
//     },
// ];
//
// export function getPreset(siteType: SiteType): StarterPreset | undefined {
//     return SITE_PRESETS.find((p) => p.siteType === siteType);
// }