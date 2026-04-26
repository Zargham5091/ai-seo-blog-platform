import mongoose, {Schema, Document, Model} from "mongoose";
import type {PlanLevel} from "./SiteTemplate";

export type ComponentCategory =
    | "section"       // Page sections (hero, features, etc)
    | "animation"     // Animation presets
    | "template"      // Full templates
    | "widget"        // Embeddable widgets
    | "integration";  // Third-party integrations

export interface IPlanComponentDocument extends Document {
    name: string;
    key: string;              // Unique identifier used in code e.g. "animation_bounce"
    category: ComponentCategory;
    description: string;
    previewImage?: string;
    previewVideo?: string;
    cssCode?: string;         // The actual CSS/animation code
    jsCode?: string;          // Optional JS for the component
    // Accessibility per plan
    availableTo: PlanLevel[];
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const PlanComponentSchema = new Schema<IPlanComponentDocument>(
    {
        name: {type: String, required: true, trim: true, maxlength: 80},
        key: {type: String, required: true, unique: true, lowercase: true, trim: true},
        category: {
            type: String,
            enum: ["section", "animation", "template", "widget", "integration"],
            required: true,
        },
        description: {type: String, maxlength: 300},
        previewImage: {type: String},
        previewVideo: {type: String},
        cssCode: {type: String},
        jsCode: {type: String},
        availableTo: [{
            type: String,
            enum: ["free", "silver", "gold", "diamond"],
        }],
        isActive: {type: Boolean, default: true},
    },
    {timestamps: true}
);

PlanComponentSchema.index({category: 1, isActive: 1});
PlanComponentSchema.index({availableTo: 1});

const PlanComponentModel: Model<IPlanComponentDocument> =
    mongoose.models.PlanComponent ??
    mongoose.model<IPlanComponentDocument>("PlanComponent", PlanComponentSchema);

export default PlanComponentModel;
