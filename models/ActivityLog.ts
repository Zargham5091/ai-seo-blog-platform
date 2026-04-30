import mongoose, {Schema, Document, Model} from "mongoose";

export interface IActivityLog extends Document {
    userId: mongoose.Types.ObjectId;
    tenantId: mongoose.Types.ObjectId; // owner's id — for team activity feed
    action: string;                    // e.g. "blog.created", "member.joined", "user.login"
    category: "blog" | "team" | "auth" | "seo" | "billing" | "system";
    metadata?: Record<string, unknown>; // extra context: blogTitle, ip, device, etc.
    ip?: string;
    userAgent?: string;
    createdAt: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>(
    {
        userId: {type: Schema.Types.ObjectId, ref: "User", required: true},
        tenantId: {type: Schema.Types.ObjectId, ref: "User", required: true},
        action: {type: String, required: true},
        category: {type: String, enum: ["blog", "team", "auth", "seo", "billing", "system"], default: "system"},
        metadata: {type: Schema.Types.Mixed},
        ip: {type: String},
        userAgent: {type: String},
    },
    {timestamps: true}
);

ActivityLogSchema.index({tenantId: 1, createdAt: -1});
ActivityLogSchema.index({userId: 1, createdAt: -1});
ActivityLogSchema.index({category: 1});

const ActivityLogModel: Model<IActivityLog> =
    mongoose.models.ActivityLog ??
    mongoose.model<IActivityLog>("ActivityLog", ActivityLogSchema);

export default ActivityLogModel;