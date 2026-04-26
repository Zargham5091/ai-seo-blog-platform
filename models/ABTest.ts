import mongoose, {Schema, Document, Model} from "mongoose";

export type ABTestStatus = "running" | "paused" | "completed";
export type ABTestMetric = "ctr" | "time_on_page" | "scroll_depth" | "conversions";

export interface IABVariantDocument {
    id: string;
    name: string;
    value: string;       // The actual headline or meta value
    impressions: number;
    clicks: number;
    ctr: number;         // calculated click-through rate
    isControl: boolean;  // true = original
}

export interface IABTestDocument extends Document {
    tenantId: mongoose.Types.ObjectId;
    blogId?: mongoose.Types.ObjectId;
    name: string;
    testType: "headline" | "meta_title" | "meta_description" | "cta";
    status: ABTestStatus;
    primaryMetric: ABTestMetric;
    variants: IABVariantDocument[];
    winnerVariantId?: string;
    startDate: Date;
    endDate?: Date;
    minimumSampleSize: number;
    confidenceLevel: number;
    createdAt: Date;
    updatedAt: Date;
}

const VariantSchema = new Schema<IABVariantDocument>({
    id: {type: String, required: true},
    name: {type: String, required: true},
    value: {type: String, required: true},
    impressions: {type: Number, default: 0},
    clicks: {type: Number, default: 0},
    ctr: {type: Number, default: 0},
    isControl: {type: Boolean, default: false},
}, {_id: false});

const ABTestSchema = new Schema<IABTestDocument>(
    {
        tenantId: {type: Schema.Types.ObjectId, ref: "User", required: true},
        blogId: {type: Schema.Types.ObjectId, ref: "Blog"},
        name: {type: String, required: true, maxlength: 100},
        testType: {type: String, enum: ["headline", "meta_title", "meta_description", "cta"], required: true},
        status: {type: String, enum: ["running", "paused", "completed"], default: "running"},
        primaryMetric: {type: String, enum: ["ctr", "time_on_page", "scroll_depth", "conversions"], default: "ctr"},
        variants: {type: [VariantSchema], default: []},
        winnerVariantId: {type: String},
        startDate: {type: Date, default: Date.now},
        endDate: {type: Date},
        minimumSampleSize: {type: Number, default: 100},
        confidenceLevel: {type: Number, default: 95},
    },
    {timestamps: true}
);

ABTestSchema.index({tenantId: 1, status: 1});

const ABTestModel: Model<IABTestDocument> =
    mongoose.models.ABTest ??
    mongoose.model<IABTestDocument>("ABTest", ABTestSchema);

export default ABTestModel;
