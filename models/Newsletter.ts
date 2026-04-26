import mongoose, {Schema, Document, Model} from "mongoose";

export type CampaignStatus = "draft" | "scheduled" | "sending" | "sent" | "failed";

export interface ISubscriberDocument {
    email: string;
    name?: string;
    subscribedAt: Date;
    isActive: boolean;
    tags: string[];
    source: string;
}

export interface INewsletterCampaignDocument extends Document {
    tenantId: mongoose.Types.ObjectId;
    subject: string;
    previewText: string;
    htmlContent: string;
    textContent: string;
    status: CampaignStatus;
    scheduledAt?: Date;
    sentAt?: Date;
    recipientCount: number;
    openCount: number;
    clickCount: number;
    unsubscribeCount: number;
    fromName: string;
    fromEmail: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface INewsletterListDocument extends Document {
    tenantId: mongoose.Types.ObjectId;
    name: string;
    description?: string;
    subscribers: ISubscriberDocument[];
    totalActive: number;
    createdAt: Date;
    updatedAt: Date;
}

const SubscriberSchema = new Schema<ISubscriberDocument>({
    email: {type: String, required: true, lowercase: true, trim: true},
    name: {type: String},
    subscribedAt: {type: Date, default: Date.now},
    isActive: {type: Boolean, default: true},
    tags: [{type: String}],
    source: {type: String, default: "manual"},
}, {_id: false});

const CampaignSchema = new Schema<INewsletterCampaignDocument>({
    tenantId: {type: Schema.Types.ObjectId, ref: "User", required: true},
    subject: {type: String, required: true, maxlength: 150},
    previewText: {type: String, maxlength: 200},
    htmlContent: {type: String},
    textContent: {type: String},
    status: {type: String, enum: ["draft", "scheduled", "sending", "sent", "failed"], default: "draft"},
    scheduledAt: {type: Date},
    sentAt: {type: Date},
    recipientCount: {type: Number, default: 0},
    openCount: {type: Number, default: 0},
    clickCount: {type: Number, default: 0},
    unsubscribeCount: {type: Number, default: 0},
    fromName: {type: String, default: "My Blog"},
    fromEmail: {type: String},
}, {timestamps: true});

const ListSchema = new Schema<INewsletterListDocument>({
    tenantId: {type: Schema.Types.ObjectId, ref: "User", required: true},
    name: {type: String, required: true},
    description: {type: String},
    subscribers: {type: [SubscriberSchema], default: []},
    totalActive: {type: Number, default: 0},
}, {timestamps: true});

CampaignSchema.index({tenantId: 1, status: 1});
ListSchema.index({tenantId: 1});

export const NewsletterCampaignModel: Model<INewsletterCampaignDocument> =
    mongoose.models.NewsletterCampaign ??
    mongoose.model<INewsletterCampaignDocument>("NewsletterCampaign", CampaignSchema);

export const NewsletterListModel: Model<INewsletterListDocument> =
    mongoose.models.NewsletterList ??
    mongoose.model<INewsletterListDocument>("NewsletterList", ListSchema);
