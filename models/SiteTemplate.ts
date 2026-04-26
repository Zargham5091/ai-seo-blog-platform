import mongoose, {Schema, Document, Model} from "mongoose";

export type TemplateTheme = "light" | "dark" | "glassmorphism" | "sketch" | "brutalist" | "minimal" | "bold";
export type TemplateStyle = "modern" | "classic" | "creative" | "corporate" | "magazine";
export type PlanLevel = "free" | "silver" | "gold" | "diamond";

export interface ITemplateSectionDocument {
    id: string;
    type: "hero" | "features" | "about" | "contact" | "cta" | "testimonials" | "faq" | "newsletter" | "custom";
    label: string;
    defaultContent: Record<string, unknown>;
    htmlTemplate: string; // Raw HTML with {{variable}} placeholders
}

export interface ISiteTemplateDocument extends Document {
    name: string;
    slug: string;
    description: string;
    previewImage: string;
    theme: TemplateTheme;
    style: TemplateStyle;
    // Color schemes
    colors: {
        primary: string;
        secondary: string;
        accent: string;
        background: string;
        text: string;
    };
    // Which plans can access this template
    minPlan: PlanLevel;
    // CSS for the entire template
    globalCSS: string;
    // Pre-built sections included in this template
    sections: ITemplateSectionDocument[];
    // Animation presets included
    animations: string[];
    isActive: boolean;
    isFeatured: boolean;
    usageCount: number;
    createdAt: Date;
    updatedAt: Date;
}

const SectionSchema = new Schema<ITemplateSectionDocument>({
    id: {type: String, required: true},
    type: {type: String, required: true},
    label: {type: String, required: true},
    defaultContent: {type: Schema.Types.Mixed, default: {}},
    htmlTemplate: {type: String, default: ""},
}, {_id: false});

const SiteTemplateSchema = new Schema<ISiteTemplateDocument>(
    {
        name: {type: String, required: true, trim: true, maxlength: 80},
        slug: {type: String, required: true, unique: true, lowercase: true, trim: true},
        description: {type: String, maxlength: 300},
        previewImage: {type: String},
        theme: {
            type: String,
            enum: ["light", "dark", "glassmorphism", "sketch", "brutalist", "minimal", "bold"],
            required: true,
        },
        style: {
            type: String,
            enum: ["modern", "classic", "creative", "corporate", "magazine"],
            required: true,
        },
        colors: {
            primary: {type: String, default: "#4F46E5"},
            secondary: {type: String, default: "#0EA5E9"},
            accent: {type: String, default: "#22C55E"},
            background: {type: String, default: "#ffffff"},
            text: {type: String, default: "#111827"},
        },
        minPlan: {
            type: String,
            enum: ["free", "silver", "gold", "diamond"],
            default: "silver",
        },
        globalCSS: {type: String, default: ""},
        sections: [SectionSchema],
        animations: [{type: String}],
        isActive: {type: Boolean, default: true},
        isFeatured: {type: Boolean, default: false},
        usageCount: {type: Number, default: 0},
    },
    {timestamps: true}
);

SiteTemplateSchema.index({minPlan: 1, isActive: 1});
SiteTemplateSchema.index({theme: 1, style: 1});

const SiteTemplateModel: Model<ISiteTemplateDocument> =
    mongoose.models.SiteTemplate ??
    mongoose.model<ISiteTemplateDocument>("SiteTemplate", SiteTemplateSchema);

export default SiteTemplateModel;
