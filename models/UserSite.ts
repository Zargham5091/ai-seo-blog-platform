import mongoose, {Schema, Document, Model} from "mongoose";

export interface IUserPageDocument {
    slug: string;           // "about", "contact", "privacy", "terms", custom slug
    title: string;
    isEnabled: boolean;
    sections: IUserSectionDocument[];
    seo: {
        metaTitle?: string;
        metaDescription?: string;
    };
}

export interface IUserSectionDocument {
    id: string;
    type: string;
    order: number;
    isVisible: boolean;
    content: Record<string, unknown>;   // User's edited content
    animationPreset?: string;           // animation key from available animations
    customCSS?: string;                 // per-section custom CSS override
}

export interface IUserSiteDocument extends Document {
    userId: mongoose.Types.ObjectId;
    // Applied template
    templateId?: mongoose.Types.ObjectId;
    // Global overrides on top of template
    primaryColor: string;
    fontFamily: string;
    // Navigation
    navStyle: "sticky" | "static" | "floating";
    navLinks: { label: string; href: string; order: number }[];
    // Footer
    footerEnabled: boolean;
    footerContent: string;
    // Pages user has built
    pages: IUserPageDocument[];
    // Active animations allowed for this user (based on plan + super admin config)
    enabledAnimations: string[];
    createdAt: Date;
    updatedAt: Date;
}

const UserSectionSchema = new Schema<IUserSectionDocument>({
    id: {type: String, required: true},
    type: {type: String, required: true},
    order: {type: Number, default: 0},
    isVisible: {type: Boolean, default: true},
    content: {type: Schema.Types.Mixed, default: {}},
    animationPreset: {type: String},
    customCSS: {type: String},
}, {_id: false});

const UserPageSchema = new Schema<IUserPageDocument>({
    slug: {type: String, required: true},
    title: {type: String, required: true},
    isEnabled: {type: Boolean, default: true},
    sections: [UserSectionSchema],
    seo: {
        metaTitle: {type: String},
        metaDescription: {type: String},
    },
}, {_id: false});

const UserSiteSchema = new Schema<IUserSiteDocument>(
    {
        userId: {type: Schema.Types.ObjectId, ref: "User", required: true, unique: true},
        templateId: {type: Schema.Types.ObjectId, ref: "SiteTemplate"},
        primaryColor: {type: String, default: "#4F46E5"},
        fontFamily: {type: String, default: "Inter"},
        navStyle: {type: String, enum: ["sticky", "static", "floating"], default: "sticky"},
        navLinks: [{
            label: {type: String},
            href: {type: String},
            order: {type: Number, default: 0},
            _id: false,
        }],
        footerEnabled: {type: Boolean, default: true},
        footerContent: {type: String, default: ""},
        pages: [UserPageSchema],
        enabledAnimations: [{type: String}],
    },
    {timestamps: true}
);

UserSiteSchema.index({userId: 1});

const UserSiteModel: Model<IUserSiteDocument> =
    mongoose.models.UserSite ??
    mongoose.model<IUserSiteDocument>("UserSite", UserSiteSchema);

export default UserSiteModel;
