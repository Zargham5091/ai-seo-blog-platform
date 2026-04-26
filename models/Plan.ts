import mongoose, {Schema, Document, Model} from "mongoose";

export interface IPlanFeaturesDocument {
    aiCreditsPerMonth: number;
    maxBlogs: number;
    maxTeamMembers: number;
    advancedSEO: boolean;
    analytics: boolean;
    customDomain: boolean;
    prioritySupport: boolean;
    apiAccess: boolean;
    whiteLabel: boolean;
    keywordResearch: boolean;
    competitorAnalysis: boolean;
    schemaGenerator: boolean;
    bulkContentGeneration: boolean;
    exportFeatures: boolean;
}

export interface IPlanBillingCycle {
    interval: "monthly" | "yearly" | "2year" | "3year";
    price: number;
    discountPercent: number;   // e.g. 20 means 20% off vs monthly
    stripePriceId?: string;
    isActive: boolean;
}

export interface IPlanDocument extends Document {
    name: string;
    slug: "free" | "silver" | "gold" | "diamond";
    description: string;
    // Legacy fields kept for backwards compatibility
    monthlyPrice: number;
    yearlyPrice: number;
    stripePriceIdMonthly?: string;
    stripePriceIdYearly?: string;
    // New: flexible billing cycles
    billingCycles: IPlanBillingCycle[];
    features: IPlanFeaturesDocument;
    isActive: boolean;
    isPopular: boolean;
    order: number;
    createdAt: Date;
    updatedAt: Date;
}

const BillingCycleSchema = new Schema<IPlanBillingCycle>({
    interval: {
        type: String,
        enum: ["monthly", "yearly", "2year", "3year"],
        required: true,
    },
    price: {type: Number, required: true, min: 0},
    discountPercent: {type: Number, default: 0, min: 0, max: 100},
    stripePriceId: {type: String},
    isActive: {type: Boolean, default: true},
}, {_id: false});

const FeaturesSchema = new Schema<IPlanFeaturesDocument>({
    aiCreditsPerMonth: {type: Number, default: 10},
    maxBlogs: {type: Number, default: 3},
    maxTeamMembers: {type: Number, default: 1},
    advancedSEO: {type: Boolean, default: false},
    analytics: {type: Boolean, default: false},
    customDomain: {type: Boolean, default: false},
    prioritySupport: {type: Boolean, default: false},
    apiAccess: {type: Boolean, default: false},
    whiteLabel: {type: Boolean, default: false},
    keywordResearch: {type: Boolean, default: false},
    competitorAnalysis: {type: Boolean, default: false},
    schemaGenerator: {type: Boolean, default: false},
    bulkContentGeneration: {type: Boolean, default: false},
    exportFeatures: {type: Boolean, default: false},
}, {_id: false});

const PlanSchema = new Schema<IPlanDocument>(
    {
        name: {type: String, required: true, trim: true},
        slug: {
            type: String,
            enum: ["free", "silver", "gold", "diamond"],
            required: true,
            unique: true,
        },
        description: {type: String, required: true},
        // Legacy monthly/yearly (used by existing checkout code — keep for compatibility)
        monthlyPrice: {type: Number, required: true, min: 0},
        yearlyPrice: {type: Number, required: true, min: 0},
        stripePriceIdMonthly: {type: String},
        stripePriceIdYearly: {type: String},
        // New flexible billing cycles
        billingCycles: [BillingCycleSchema],
        features: {type: FeaturesSchema, default: () => ({})},
        isActive: {type: Boolean, default: true},
        isPopular: {type: Boolean, default: false},
        order: {type: Number, default: 0},
    },
    {timestamps: true}
);

const PlanModel: Model<IPlanDocument> =
    mongoose.models.Plan ??
    mongoose.model<IPlanDocument>("Plan", PlanSchema);

export default PlanModel;


// import mongoose, { Schema, Document, Model } from "mongoose";
//
// export interface IPlanDocument extends Document {
//   name: string;
//   slug: "free" | "silver" | "gold" | "diamond";
//   description: string;
//   monthlyPrice: number;
//   yearlyPrice: number;
//   stripePriceIdMonthly?: string;
//   stripePriceIdYearly?: string;
//   features: {
//     aiCreditsPerMonth: number;
//     maxBlogs: number;
//     maxTeamMembers: number;
//     advancedSEO: boolean;
//     analytics: boolean;
//     customDomain: boolean;
//     prioritySupport: boolean;
//     apiAccess: boolean;
//     whiteLabel: boolean;
//     keywordResearch: boolean;
//     competitorAnalysis: boolean;
//     schemaGenerator: boolean;
//     bulkContentGeneration: boolean;
//     exportFeatures: boolean;
//   };
//   isActive: boolean;
//   isPopular: boolean;
//   order: number;
//   createdAt: Date;
//   updatedAt: Date;
// }
//
// const FeaturesSchema = new Schema({
//   aiCreditsPerMonth: { type: Number, default: 10 },
//   maxBlogs: { type: Number, default: 3 },
//   maxTeamMembers: { type: Number, default: 1 },
//   advancedSEO: { type: Boolean, default: false },
//   analytics: { type: Boolean, default: false },
//   customDomain: { type: Boolean, default: false },
//   prioritySupport: { type: Boolean, default: false },
//   apiAccess: { type: Boolean, default: false },
//   whiteLabel: { type: Boolean, default: false },
//   keywordResearch: { type: Boolean, default: false },
//   competitorAnalysis: { type: Boolean, default: false },
//   schemaGenerator: { type: Boolean, default: false },
//   bulkContentGeneration: { type: Boolean, default: false },
//   exportFeatures: { type: Boolean, default: false },
// }, { _id: false });
//
// const PlanSchema = new Schema<IPlanDocument>(
//   {
//     name: { type: String, required: true, trim: true },
//     slug: { type: String, enum: ["free", "silver", "gold", "diamond"], required: true, unique: true },
//     description: { type: String, required: true },
//     monthlyPrice: { type: Number, required: true, min: 0 },
//     yearlyPrice: { type: Number, required: true, min: 0 },
//     stripePriceIdMonthly: { type: String },
//     stripePriceIdYearly: { type: String },
//     features: { type: FeaturesSchema, default: () => ({}) },
//     isActive: { type: Boolean, default: true },
//     isPopular: { type: Boolean, default: false },
//     order: { type: Number, default: 0 },
//   },
//   { timestamps: true }
// );
//
// const PlanModel: Model<IPlanDocument> =
//   mongoose.models.Plan ?? mongoose.model<IPlanDocument>("Plan", PlanSchema);
//
// export default PlanModel;
