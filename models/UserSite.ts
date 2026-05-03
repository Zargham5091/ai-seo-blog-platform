import mongoose, {Schema, Document, Model} from "mongoose";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type SiteType = "blog" | "portfolio" | "saas" | "ecommerce" | "restaurant" | "agency" | "custom";
export type NavStyle = "sticky" | "static" | "floating" | "sidebar";
export type PageRole = "home" | "about" | "blog" | "contact" | "pricing" | "portfolio" | "shop" | "custom";

// A single component instance placed on the canvas
export interface ICanvasComponent {
    instanceId: string;               // Unique per placement (uuid)
    componentKey: string;             // References PlanComponent.key
    componentId: mongoose.Types.ObjectId; // References PlanComponent._id
    order: number;                    // Sort order on the page
    isVisible: boolean;
    isLocked: boolean;                // Locked components can't be moved/edited by team members
    // User-edited prop values — keys match PlanComponent.propsSchema[].key
    propValues: Record<string, unknown>;
    // Per-instance overrides
    customCSS?: string;
    animationPreset?: string;         // animation component key to apply
    // Responsive visibility
    hideOnMobile?: boolean;
    hideOnDesktop?: boolean;
}

// A page in the user's site
export interface IUserPage {
    pageId: string;                   // uuid
    slug: string;                     // URL slug e.g. "about", "pricing"
    title: string;
    role: PageRole;
    isEnabled: boolean;
    isHomePage: boolean;
    showInNav: boolean;               // Auto-adds to nav links if true
    components: ICanvasComponent[];
    seo: {
        metaTitle?: string;
        metaDescription?: string;
        ogImage?: string;
        canonicalUrl?: string;
        noIndex?: boolean;
    };
    // Per-page overrides (inherits from site global if not set)
    customCSS?: string;
    createdAt: Date;
    updatedAt: Date;
}

// Global site settings
export interface IUserSiteDocument extends Document {
    userId: mongoose.Types.ObjectId;

    // ── Site identity ─────────────────────────────────────────────────────────
    siteName: string;
    siteTagline?: string;
    siteLogo?: string;
    favicon?: string;
    siteType: SiteType;

    // ── Applied template (optional base) ─────────────────────────────────────
    templateId?: mongoose.Types.ObjectId;
    templateAppliedAt?: Date;

    // ── Global design tokens ──────────────────────────────────────────────────
    theme: {
        primaryColor: string;
        secondaryColor: string;
        accentColor: string;
        backgroundColor: string;
        textColor: string;
        fontHeading: string;        // e.g. "Playfair Display"
        fontBody: string;           // e.g. "Source Sans Pro"
        borderRadius: "none" | "sm" | "md" | "lg" | "full";
        shadowStyle: "none" | "sm" | "md" | "lg";
        darkMode: boolean;
    };

    // ── Global CSS (appended to all pages) ────────────────────────────────────
    globalCSS: string;

    // ── Navigation ────────────────────────────────────────────────────────────
    navbar: {
        componentKey?: string;      // Which navbar component is used
        style: NavStyle;
        isTransparent: boolean;
        links: {
            label: string;
            href: string;
            order: number;
            openInNewTab?: boolean;
            children?: { label: string; href: string }[];
        }[];
        ctaLabel?: string;
        ctaHref?: string;
        showThemeToggle: boolean;
    };

    // ── Footer ────────────────────────────────────────────────────────────────
    footer: {
        componentKey?: string;      // Which footer component is used
        isEnabled: boolean;
        columns: {
            heading: string;
            links: { label: string; href: string }[];
        }[];
        bottomText: string;
        socialLinks: {
            platform: string;       // "twitter", "github", "linkedin", etc.
            url: string;
        }[];
    };

    // ── Pages ─────────────────────────────────────────────────────────────────
    pages: IUserPage[];

    // ── Analytics & integrations ──────────────────────────────────────────────
    integrations: {
        googleAnalyticsId?: string;
        googleTagManagerId?: string;
        facebookPixelId?: string;
        hotjarId?: string;
        customHeadCode?: string;    // Injected into <head>
        customBodyCode?: string;    // Injected before </body>
    };

    // ── Publishing ────────────────────────────────────────────────────────────
    isPublished: boolean;
    publishedAt?: Date;
    lastBuiltAt?: Date;             // When static HTML was last generated

    // ── Builder state (persisted for UX continuity) ───────────────────────────
    builderState: {
        activePageId?: string;
        selectedInstanceId?: string;
        zoom: number;
        devicePreview: "desktop" | "tablet" | "mobile";
        aiSuggestionsEnabled: boolean;
    };

    // ── Team access control ───────────────────────────────────────────────────
    /**
     * Team members can have restricted access to specific pages.
     * Inherits from User.teamMembers but site-level grants override.
     */
    pagePermissions: {
        userId: mongoose.Types.ObjectId;
        pageIds: string[];           // Empty = all pages. Otherwise restricted.
        canPublish: boolean;
    }[];

    createdAt: Date;
    updatedAt: Date;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-schemas
// ─────────────────────────────────────────────────────────────────────────────

const CanvasComponentSchema = new Schema<ICanvasComponent>(
    {
        instanceId: {type: String, required: true},
        componentKey: {type: String, required: true},
        componentId: {type: Schema.Types.ObjectId, ref: "PlanComponent", required: true},
        order: {type: Number, default: 0},
        isVisible: {type: Boolean, default: true},
        isLocked: {type: Boolean, default: false},
        propValues: {type: Schema.Types.Mixed, default: {}},
        customCSS: {type: String, default: ""},
        animationPreset: {type: String},
        hideOnMobile: {type: Boolean, default: false},
        hideOnDesktop: {type: Boolean, default: false},
    },
    {_id: false}
);

const UserPageSchema = new Schema<IUserPage>(
    {
        pageId: {type: String, required: true},
        slug: {type: String, required: true},
        title: {type: String, required: true},
        role: {
            type: String,
            enum: ["home", "about", "blog", "contact", "pricing", "portfolio", "shop", "custom"],
            default: "custom",
        },
        isEnabled: {type: Boolean, default: true},
        isHomePage: {type: Boolean, default: false},
        showInNav: {type: Boolean, default: true},
        components: [CanvasComponentSchema],
        seo: {
            metaTitle: {type: String},
            metaDescription: {type: String},
            ogImage: {type: String},
            canonicalUrl: {type: String},
            noIndex: {type: Boolean, default: false},
        },
        customCSS: {type: String, default: ""},
        createdAt: {type: Date, default: Date.now},
        updatedAt: {type: Date, default: Date.now},
    },
    {_id: false}
);

// ─────────────────────────────────────────────────────────────────────────────
// Main schema
// ─────────────────────────────────────────────────────────────────────────────

const UserSiteSchema = new Schema<IUserSiteDocument>(
    {
        userId: {type: Schema.Types.ObjectId, ref: "User", required: true, unique: true},

        siteName: {type: String, default: "My Site", maxlength: 80},
        siteTagline: {type: String, maxlength: 160},
        siteLogo: {type: String},
        favicon: {type: String},
        siteType: {
            type: String,
            enum: ["blog", "portfolio", "saas", "ecommerce", "restaurant", "agency", "custom"],
            default: "custom",
        },

        templateId: {type: Schema.Types.ObjectId, ref: "SiteTemplate"},
        templateAppliedAt: {type: Date},

        theme: {
            primaryColor: {type: String, default: "#4F46E5"},
            secondaryColor: {type: String, default: "#0EA5E9"},
            accentColor: {type: String, default: "#22C55E"},
            backgroundColor: {type: String, default: "#ffffff"},
            textColor: {type: String, default: "#111827"},
            fontHeading: {type: String, default: "Playfair Display"},
            fontBody: {type: String, default: "Source Sans Pro"},
            borderRadius: {type: String, enum: ["none", "sm", "md", "lg", "full"], default: "md"},
            shadowStyle: {type: String, enum: ["none", "sm", "md", "lg"], default: "md"},
            darkMode: {type: Boolean, default: false},
        },

        globalCSS: {type: String, default: ""},

        navbar: {
            componentKey: {type: String},
            style: {type: String, enum: ["sticky", "static", "floating", "sidebar"], default: "sticky"},
            isTransparent: {type: Boolean, default: false},
            links: [{
                label: {type: String},
                href: {type: String},
                order: {type: Number, default: 0},
                openInNewTab: {type: Boolean, default: false},
                children: [{label: String, href: String, _id: false}],
                _id: false,
            }],
            ctaLabel: {type: String},
            ctaHref: {type: String},
            showThemeToggle: {type: Boolean, default: false},
        },

        footer: {
            componentKey: {type: String},
            isEnabled: {type: Boolean, default: true},
            columns: [{
                heading: {type: String},
                links: [{label: String, href: String, _id: false}],
                _id: false,
            }],
            bottomText: {type: String, default: "© 2025. All rights reserved."},
            socialLinks: [{
                platform: {type: String},
                url: {type: String},
                _id: false,
            }],
        },

        pages: [UserPageSchema],

        integrations: {
            googleAnalyticsId: {type: String},
            googleTagManagerId: {type: String},
            facebookPixelId: {type: String},
            hotjarId: {type: String},
            customHeadCode: {type: String, default: ""},
            customBodyCode: {type: String, default: ""},
        },

        isPublished: {type: Boolean, default: false},
        publishedAt: {type: Date},
        lastBuiltAt: {type: Date},

        builderState: {
            activePageId: {type: String},
            selectedInstanceId: {type: String},
            zoom: {type: Number, default: 100},
            devicePreview: {type: String, enum: ["desktop", "tablet", "mobile"], default: "desktop"},
            aiSuggestionsEnabled: {type: Boolean, default: true},
        },

        pagePermissions: [{
            userId: {type: Schema.Types.ObjectId, ref: "User"},
            pageIds: [{type: String}],
            canPublish: {type: Boolean, default: false},
            _id: false,
        }],
    },
    {timestamps: true}
);

UserSiteSchema.index({userId: 1});
UserSiteSchema.index({isPublished: 1});
UserSiteSchema.index({siteType: 1});

const UserSiteModel: Model<IUserSiteDocument> =
    mongoose.models.UserSite ??
    mongoose.model<IUserSiteDocument>("UserSite", UserSiteSchema);

export default UserSiteModel;
// import mongoose, {Schema, Document, Model} from "mongoose";
//
// export interface IUserPageDocument {
//     slug: string;           // "about", "contact", "privacy", "terms", custom slug
//     title: string;
//     isEnabled: boolean;
//     sections: IUserSectionDocument[];
//     seo: {
//         metaTitle?: string;
//         metaDescription?: string;
//     };
// }
//
// export interface IUserSectionDocument {
//     id: string;
//     type: string;
//     order: number;
//     isVisible: boolean;
//     content: Record<string, unknown>;   // User's edited content
//     animationPreset?: string;           // animation key from available animations
//     customCSS?: string;                 // per-section custom CSS override
// }
//
// export interface IUserSiteDocument extends Document {
//     userId: mongoose.Types.ObjectId;
//     // Applied template
//     templateId?: mongoose.Types.ObjectId;
//     // Global overrides on top of template
//     primaryColor: string;
//     fontFamily: string;
//     // Navigation
//     navStyle: "sticky" | "static" | "floating";
//     navLinks: { label: string; href: string; order: number }[];
//     // Footer
//     footerEnabled: boolean;
//     footerContent: string;
//     // Pages user has built
//     pages: IUserPageDocument[];
//     // Active animations allowed for this user (based on plan + super admin config)
//     enabledAnimations: string[];
//     createdAt: Date;
//     updatedAt: Date;
// }
//
// const UserSectionSchema = new Schema<IUserSectionDocument>({
//     id: {type: String, required: true},
//     type: {type: String, required: true},
//     order: {type: Number, default: 0},
//     isVisible: {type: Boolean, default: true},
//     content: {type: Schema.Types.Mixed, default: {}},
//     animationPreset: {type: String},
//     customCSS: {type: String},
// }, {_id: false});
//
// const UserPageSchema = new Schema<IUserPageDocument>({
//     slug: {type: String, required: true},
//     title: {type: String, required: true},
//     isEnabled: {type: Boolean, default: true},
//     sections: [UserSectionSchema],
//     seo: {
//         metaTitle: {type: String},
//         metaDescription: {type: String},
//     },
// }, {_id: false});
//
// const UserSiteSchema = new Schema<IUserSiteDocument>(
//     {
//         userId: {type: Schema.Types.ObjectId, ref: "User", required: true, unique: true},
//         templateId: {type: Schema.Types.ObjectId, ref: "SiteTemplate"},
//         primaryColor: {type: String, default: "#4F46E5"},
//         fontFamily: {type: String, default: "Inter"},
//         navStyle: {type: String, enum: ["sticky", "static", "floating"], default: "sticky"},
//         navLinks: [{
//             label: {type: String},
//             href: {type: String},
//             order: {type: Number, default: 0},
//             _id: false,
//         }],
//         footerEnabled: {type: Boolean, default: true},
//         footerContent: {type: String, default: ""},
//         pages: [UserPageSchema],
//         enabledAnimations: [{type: String}],
//     },
//     {timestamps: true}
// );
//
// UserSiteSchema.index({userId: 1});
//
// const UserSiteModel: Model<IUserSiteDocument> =
//     mongoose.models.UserSite ??
//     mongoose.model<IUserSiteDocument>("UserSite", UserSiteSchema);
//
// export default UserSiteModel;
