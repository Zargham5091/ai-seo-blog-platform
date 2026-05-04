import mongoose, {Schema, Document, Model} from "mongoose";

export type SiteType = "blog" | "portfolio" | "saas" | "ecommerce" | "restaurant" | "agency" | "custom";
export type NavStyle = "sticky" | "static" | "floating" | "sidebar";
export type PageRole = "home" | "about" | "blog" | "contact" | "pricing" | "portfolio" | "shop" | "custom";

export interface ICanvasComponent {
    instanceId: string;
    componentKey: string;
    componentId: mongoose.Types.ObjectId;
    order: number;
    isVisible: boolean;
    isLocked: boolean;
    propValues: Record<string, unknown>;
    customCSS?: string;
    animationPreset?: string;
    hideOnMobile?: boolean;
    hideOnDesktop?: boolean;
}

export interface IUserPage {
    pageId: string;
    slug: string;
    title: string;
    role: PageRole;
    isEnabled: boolean;
    isHomePage: boolean;
    showInNav: boolean;
    components: ICanvasComponent[];
    seo: {
        metaTitle?: string;
        metaDescription?: string;
        ogImage?: string;
        canonicalUrl?: string;
        noIndex?: boolean;
    };
    customCSS?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface IUserSiteDocument extends Document {
    userId: mongoose.Types.ObjectId;
    siteName: string;
    siteTagline?: string;
    siteLogo?: string;
    favicon?: string;
    siteType: SiteType;

    // ── NEW: Domain fields ─────────────────────────────────────────────────
    customDomain?: string;
    customDomainVerified?: boolean;
    customDomainVerifiedAt?: Date;

    templateId?: mongoose.Types.ObjectId;
    templateAppliedAt?: Date;

    theme: {
        primaryColor: string; secondaryColor: string; accentColor: string;
        backgroundColor: string; textColor: string; fontHeading: string;
        fontBody: string; borderRadius: "none" | "sm" | "md" | "lg" | "full";
        shadowStyle: "none" | "sm" | "md" | "lg"; darkMode: boolean;
    };
    globalCSS: string;
    navbar: {
        componentKey?: string; style: NavStyle; isTransparent: boolean;
        links: {
            label: string;
            href: string;
            order: number;
            openInNewTab?: boolean;
            children?: { label: string; href: string }[]
        }[];
        ctaLabel?: string; ctaHref?: string; showThemeToggle: boolean;
    };
    footer: {
        componentKey?: string; isEnabled: boolean;
        columns: { heading: string; links: { label: string; href: string }[] }[];
        bottomText: string; socialLinks: { platform: string; url: string }[];
    };
    pages: IUserPage[];
    integrations: {
        googleAnalyticsId?: string; googleTagManagerId?: string;
        facebookPixelId?: string; hotjarId?: string;
        customHeadCode?: string; customBodyCode?: string;
    };
    isPublished: boolean;
    publishedAt?: Date;
    lastBuiltAt?: Date;
    builderState: {
        activePageId?: string; selectedInstanceId?: string;
        zoom: number; devicePreview: "desktop" | "tablet" | "mobile";
        aiSuggestionsEnabled: boolean;
    };
    pagePermissions: { userId: mongoose.Types.ObjectId; pageIds: string[]; canPublish: boolean }[];
    createdAt: Date;
    updatedAt: Date;
}

const CanvasComponentSchema = new Schema<ICanvasComponent>({
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
}, {_id: false});

const UserPageSchema = new Schema<IUserPage>({
    pageId: {type: String, required: true},
    slug: {type: String, required: true},
    title: {type: String, required: true},
    role: {
        type: String,
        enum: ["home", "about", "blog", "contact", "pricing", "portfolio", "shop", "custom"],
        default: "custom"
    },
    isEnabled: {type: Boolean, default: true},
    isHomePage: {type: Boolean, default: false},
    showInNav: {type: Boolean, default: true},
    components: [CanvasComponentSchema],
    seo: {
        metaTitle: {type: String}, metaDescription: {type: String},
        ogImage: {type: String}, canonicalUrl: {type: String}, noIndex: {type: Boolean, default: false},
    },
    customCSS: {type: String, default: ""},
    createdAt: {type: Date, default: Date.now},
    updatedAt: {type: Date, default: Date.now},
}, {_id: false});

const UserSiteSchema = new Schema<IUserSiteDocument>({
    userId: {type: Schema.Types.ObjectId, ref: "User", required: true, unique: true},
    siteName: {type: String, default: "My Site", maxlength: 80},
    siteTagline: {type: String, maxlength: 160},
    siteLogo: {type: String},
    favicon: {type: String},
    siteType: {
        type: String,
        enum: ["blog", "portfolio", "saas", "ecommerce", "restaurant", "agency", "custom"],
        default: "custom"
    },

    // Domain
    customDomain: {type: String, lowercase: true, trim: true, sparse: true},
    customDomainVerified: {type: Boolean, default: false},
    customDomainVerifiedAt: {type: Date},

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
            _id: false
        }],
        ctaLabel: {type: String},
        ctaHref: {type: String},
        showThemeToggle: {type: Boolean, default: false},
    },
    footer: {
        componentKey: {type: String},
        isEnabled: {type: Boolean, default: true},
        columns: [{heading: {type: String}, links: [{label: String, href: String, _id: false}], _id: false}],
        bottomText: {type: String, default: "© 2025. All rights reserved."},
        socialLinks: [{platform: String, url: String, _id: false}],
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
        _id: false
    }],
}, {timestamps: true});

UserSiteSchema.index({userId: 1});
UserSiteSchema.index({isPublished: 1});
UserSiteSchema.index({customDomain: 1}, {sparse: true});

const UserSiteModel: Model<IUserSiteDocument> =
    mongoose.models.UserSite ??
    mongoose.model<IUserSiteDocument>("UserSite", UserSiteSchema);

export default UserSiteModel;
// import mongoose, {Schema, Document, Model} from "mongoose";
//
// export type SiteType = "blog" | "portfolio" | "saas" | "ecommerce" | "restaurant" | "agency" | "custom";
// export type NavStyle = "sticky" | "static" | "floating" | "sidebar";
// export type PageRole = "home" | "about" | "blog" | "contact" | "pricing" | "portfolio" | "shop" | "custom";
//
// export interface ICanvasComponent {
//     instanceId: string;
//     componentKey: string;
//     componentId: mongoose.Types.ObjectId;
//     order: number;
//     isVisible: boolean;
//     isLocked: boolean;
//     propValues: Record<string, unknown>;
//     customCSS?: string;
//     animationPreset?: string;
//     hideOnMobile?: boolean;
//     hideOnDesktop?: boolean;
// }
//
// export interface IUserPage {
//     pageId: string;
//     slug: string;
//     title: string;
//     role: PageRole;
//     isEnabled: boolean;
//     isHomePage: boolean;
//     showInNav: boolean;
//     components: ICanvasComponent[];
//     seo: {
//         metaTitle?: string;
//         metaDescription?: string;
//         ogImage?: string;
//         canonicalUrl?: string;
//         noIndex?: boolean;
//     };
//     customCSS?: string;
//     createdAt: Date;
//     updatedAt: Date;
// }
//
// export interface IUserSiteDocument extends Document {
//     userId: mongoose.Types.ObjectId;
//     siteName: string;
//     siteTagline?: string;
//     siteLogo?: string;
//     favicon?: string;
//     siteType: SiteType;
//
//     // ── NEW: Domain fields ─────────────────────────────────────────────────
//     customDomain?: string;
//     customDomainVerified?: boolean;
//     customDomainVerifiedAt?: Date;
//
//     templateId?: mongoose.Types.ObjectId;
//     templateAppliedAt?: Date;
//
//     theme: {
//         primaryColor: string; secondaryColor: string; accentColor: string;
//         backgroundColor: string; textColor: string; fontHeading: string;
//         fontBody: string; borderRadius: "none" | "sm" | "md" | "lg" | "full";
//         shadowStyle: "none" | "sm" | "md" | "lg"; darkMode: boolean;
//     };
//     globalCSS: string;
//     navbar: {
//         componentKey?: string; style: NavStyle; isTransparent: boolean;
//         links: {
//             label: string;
//             href: string;
//             order: number;
//             openInNewTab?: boolean;
//             children?: { label: string; href: string }[]
//         }[];
//         ctaLabel?: string; ctaHref?: string; showThemeToggle: boolean;
//     };
//     footer: {
//         componentKey?: string; isEnabled: boolean;
//         columns: { heading: string; links: { label: string; href: string }[] }[];
//         bottomText: string; socialLinks: { platform: string; url: string }[];
//     };
//     pages: IUserPage[];
//     integrations: {
//         googleAnalyticsId?: string; googleTagManagerId?: string;
//         facebookPixelId?: string; hotjarId?: string;
//         customHeadCode?: string; customBodyCode?: string;
//     };
//     isPublished: boolean;
//     publishedAt?: Date;
//     lastBuiltAt?: Date;
//     builderState: {
//         activePageId?: string; selectedInstanceId?: string;
//         zoom: number; devicePreview: "desktop" | "tablet" | "mobile";
//         aiSuggestionsEnabled: boolean;
//     };
//     pagePermissions: { userId: mongoose.Types.ObjectId; pageIds: string[]; canPublish: boolean }[];
//     createdAt: Date;
//     updatedAt: Date;
// }
//
// const CanvasComponentSchema = new Schema<ICanvasComponent>({
//     instanceId: {type: String, required: true},
//     componentKey: {type: String, required: true},
//     componentId: {type: Schema.Types.ObjectId, ref: "PlanComponent", required: true},
//     order: {type: Number, default: 0},
//     isVisible: {type: Boolean, default: true},
//     isLocked: {type: Boolean, default: false},
//     propValues: {type: Schema.Types.Mixed, default: {}},
//     customCSS: {type: String, default: ""},
//     animationPreset: {type: String},
//     hideOnMobile: {type: Boolean, default: false},
//     hideOnDesktop: {type: Boolean, default: false},
// }, {_id: false});
//
// const UserPageSchema = new Schema<IUserPage>({
//     pageId: {type: String, required: true},
//     slug: {type: String, required: true},
//     title: {type: String, required: true},
//     role: {
//         type: String,
//         enum: ["home", "about", "blog", "contact", "pricing", "portfolio", "shop", "custom"],
//         default: "custom"
//     },
//     isEnabled: {type: Boolean, default: true},
//     isHomePage: {type: Boolean, default: false},
//     showInNav: {type: Boolean, default: true},
//     components: [CanvasComponentSchema],
//     seo: {
//         metaTitle: {type: String}, metaDescription: {type: String},
//         ogImage: {type: String}, canonicalUrl: {type: String}, noIndex: {type: Boolean, default: false},
//     },
//     customCSS: {type: String, default: ""},
//     createdAt: {type: Date, default: Date.now},
//     updatedAt: {type: Date, default: Date.now},
// }, {_id: false});
//
// const UserSiteSchema = new Schema<IUserSiteDocument>({
//     userId: {type: Schema.Types.ObjectId, ref: "User", required: true, unique: true},
//     siteName: {type: String, default: "My Site", maxlength: 80},
//     siteTagline: {type: String, maxlength: 160},
//     siteLogo: {type: String},
//     favicon: {type: String},
//     siteType: {
//         type: String,
//         enum: ["blog", "portfolio", "saas", "ecommerce", "restaurant", "agency", "custom"],
//         default: "custom"
//     },
//
//     // Domain
//     customDomain: {type: String, lowercase: true, trim: true, sparse: true},
//     customDomainVerified: {type: Boolean, default: false},
//     customDomainVerifiedAt: {type: Date},
//
//     templateId: {type: Schema.Types.ObjectId, ref: "SiteTemplate"},
//     templateAppliedAt: {type: Date},
//
//     theme: {
//         primaryColor: {type: String, default: "#4F46E5"},
//         secondaryColor: {type: String, default: "#0EA5E9"},
//         accentColor: {type: String, default: "#22C55E"},
//         backgroundColor: {type: String, default: "#ffffff"},
//         textColor: {type: String, default: "#111827"},
//         fontHeading: {type: String, default: "Playfair Display"},
//         fontBody: {type: String, default: "Source Sans Pro"},
//         borderRadius: {type: String, enum: ["none", "sm", "md", "lg", "full"], default: "md"},
//         shadowStyle: {type: String, enum: ["none", "sm", "md", "lg"], default: "md"},
//         darkMode: {type: Boolean, default: false},
//     },
//     globalCSS: {type: String, default: ""},
//     navbar: {
//         componentKey: {type: String},
//         style: {type: String, enum: ["sticky", "static", "floating", "sidebar"], default: "sticky"},
//         isTransparent: {type: Boolean, default: false},
//         links: [{
//             label: {type: String},
//             href: {type: String},
//             order: {type: Number, default: 0},
//             openInNewTab: {type: Boolean, default: false},
//             children: [{label: String, href: String, _id: false}],
//             _id: false
//         }],
//         ctaLabel: {type: String},
//         ctaHref: {type: String},
//         showThemeToggle: {type: Boolean, default: false},
//     },
//     footer: {
//         componentKey: {type: String},
//         isEnabled: {type: Boolean, default: true},
//         columns: [{heading: {type: String}, links: [{label: String, href: String, _id: false}], _id: false}],
//         bottomText: {type: String, default: "© 2025. All rights reserved."},
//         socialLinks: [{platform: String, url: String, _id: false}],
//     },
//     pages: [UserPageSchema],
//     integrations: {
//         googleAnalyticsId: {type: String},
//         googleTagManagerId: {type: String},
//         facebookPixelId: {type: String},
//         hotjarId: {type: String},
//         customHeadCode: {type: String, default: ""},
//         customBodyCode: {type: String, default: ""},
//     },
//     isPublished: {type: Boolean, default: false},
//     publishedAt: {type: Date},
//     lastBuiltAt: {type: Date},
//     builderState: {
//         activePageId: {type: String},
//         selectedInstanceId: {type: String},
//         zoom: {type: Number, default: 100},
//         devicePreview: {type: String, enum: ["desktop", "tablet", "mobile"], default: "desktop"},
//         aiSuggestionsEnabled: {type: Boolean, default: true},
//     },
//     pagePermissions: [{
//         userId: {type: Schema.Types.ObjectId, ref: "User"},
//         pageIds: [{type: String}],
//         canPublish: {type: Boolean, default: false},
//         _id: false
//     }],
// }, {timestamps: true});
//
// UserSiteSchema.index({userId: 1});
// UserSiteSchema.index({isPublished: 1});
// UserSiteSchema.index({customDomain: 1}, {sparse: true});
//
// const UserSiteModel: Model<IUserSiteDocument> =
//     mongoose.models.UserSite ??
//     mongoose.model<IUserSiteDocument>("UserSite", UserSiteSchema);
//
// export default UserSiteModel;
