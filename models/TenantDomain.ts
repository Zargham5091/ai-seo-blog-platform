import mongoose, {Schema, Document, Model} from "mongoose";

export interface ITenantDomainDocument extends Document {
    userId: mongoose.Types.ObjectId;
    subdomain: string;
    customDomain?: string;
    customDomainVerified: boolean;
    // DNS verification token (user adds as TXT record to prove domain ownership)
    customDomainVerifyToken?: string;
    siteName: string;
    siteDescription: string;
    siteLogo?: string;
    siteTheme: "light" | "dark" | "auto";
    primaryColor: string;
    navLinks: { label: string; href: string }[];
    social: {
        twitter?: string;
        linkedin?: string;
        github?: string;
        website?: string;
    };
    defaultMetaTitle: string;
    defaultMetaDescription: string;
    defaultOgImage?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const TenantDomainSchema = new Schema<ITenantDomainDocument>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
        },
        subdomain: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            match: [
                /^[a-z0-9][a-z0-9-]{1,30}[a-z0-9]$/,
                "Subdomain must be 3-32 chars: lowercase letters, numbers, hyphens. Cannot start or end with a hyphen.",
            ],
        },
        customDomain: {
            type: String,
            lowercase: true,
            trim: true,
            sparse: true, // allows multiple null values (unique only when set)
            unique: true,
        },
        customDomainVerified: {type: Boolean, default: false},
        customDomainVerifyToken: {type: String},
        siteName: {type: String, default: "My Blog", maxlength: 80},
        siteDescription: {type: String, default: "", maxlength: 300},
        siteLogo: {type: String},
        siteTheme: {type: String, enum: ["light", "dark", "auto"], default: "auto"},
        primaryColor: {
            type: String,
            default: "#4F46E5",
            match: [/^#[0-9a-fA-F]{6}$/, "Must be a valid 6-digit hex color"],
        },
        navLinks: [
            {
                label: {type: String, required: true, maxlength: 40},
                href: {type: String, required: true, maxlength: 200},
                _id: false,
            },
        ],
        social: {
            twitter: {type: String, maxlength: 100},
            linkedin: {type: String, maxlength: 200},
            github: {type: String, maxlength: 200},
            website: {type: String, maxlength: 200},
        },
        defaultMetaTitle: {type: String, default: "", maxlength: 60},
        defaultMetaDescription: {type: String, default: "", maxlength: 160},
        defaultOgImage: {type: String},
        isActive: {type: Boolean, default: true},
    },
    {timestamps: true}
);

const TenantDomainModel: Model<ITenantDomainDocument> =
    mongoose.models.TenantDomain ??
    mongoose.model<ITenantDomainDocument>("TenantDomain", TenantDomainSchema);

export default TenantDomainModel;
