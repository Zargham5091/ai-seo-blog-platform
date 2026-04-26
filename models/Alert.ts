import mongoose, {Schema, Document, Model} from "mongoose";

export type AlertType =
    | "rank_drop"
    | "rank_improve"
    | "rank_goal_reached"
    | "new_backlink"
    | "lost_backlink"
    | "keyword_spike"
    | "ai_credits_low"
    | "ai_credits_exhausted"
    | "plan_expiring"
    | "featured_approved"
    | "featured_rejected"
    | "team_invite";

export type AlertChannel = "in_app" | "email" | "both";

export interface IAlertSettingDocument extends Document {
    userId: mongoose.Types.ObjectId;
    // Which alerts are enabled
    enabledAlerts: AlertType[];
    channel: AlertChannel;
    emailAddress: string;
    // Thresholds
    rankDropThreshold: number;      // Alert if position drops by this many spots
    creditThreshold: number;        // Alert when credits fall below this %
    createdAt: Date;
    updatedAt: Date;
}

export interface IAlertDocument extends Document {
    userId: mongoose.Types.ObjectId;
    type: AlertType;
    title: string;
    message: string;
    data?: Record<string, unknown>;  // Extra context e.g. { keyword, oldPos, newPos }
    isRead: boolean;
    emailSent: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const AlertSettingSchema = new Schema<IAlertSettingDocument>(
    {
        userId: {type: Schema.Types.ObjectId, ref: "User", required: true, unique: true},
        enabledAlerts: [{type: String}],
        channel: {type: String, enum: ["in_app", "email", "both"], default: "in_app"},
        emailAddress: {type: String},
        rankDropThreshold: {type: Number, default: 5},
        creditThreshold: {type: Number, default: 20},
    },
    {timestamps: true}
);

const AlertSchema = new Schema<IAlertDocument>(
    {
        userId: {type: Schema.Types.ObjectId, ref: "User", required: true},
        type: {type: String, required: true},
        title: {type: String, required: true},
        message: {type: String, required: true},
        data: {type: Schema.Types.Mixed},
        isRead: {type: Boolean, default: false},
        emailSent: {type: Boolean, default: false},
    },
    {timestamps: true}
);

AlertSchema.index({userId: 1, isRead: 1});
AlertSchema.index({userId: 1, createdAt: -1});

export const AlertSettingModel: Model<IAlertSettingDocument> =
    mongoose.models.AlertSetting ??
    mongoose.model<IAlertSettingDocument>("AlertSetting", AlertSettingSchema);

export const AlertModel: Model<IAlertDocument> =
    mongoose.models.Alert ??
    mongoose.model<IAlertDocument>("Alert", AlertSchema);

// import mongoose, {Schema, Document, Model} from "mongoose";
//
// export type AlertType =
//     | "rank_drop"
//     | "rank_improve"
//     | "rank_goal_reached"
//     | "new_backlink"
//     | "lost_backlink"
//     | "keyword_spike"
//     | "ai_credits_low"
//     | "ai_credits_exhausted"
//     | "plan_expiring"
//     | "featured_approved"
//     | "featured_rejected"
//     | "team_invite";
//
// export type AlertChannel = "in_app" | "email" | "both";
//
// export interface IAlertSettingDocument extends Document {
//     userId: mongoose.Types.ObjectId;
//     // Which alerts are enabled
//     enabledAlerts: AlertType[];
//     channel: AlertChannel;
//     emailAddress: string;
//     // Thresholds
//     rankDropThreshold: number;      // Alert if position drops by this many spots
//     creditThreshold: number;        // Alert when credits fall below this %
//     createdAt: Date;
//     updatedAt: Date;
// }
//
// export interface IAlertDocument extends Document {
//     userId: mongoose.Types.ObjectId;
//     type: AlertType;
//     title: string;
//     message: string;
//     data?: Record<string, unknown>;  // Extra context e.g. { keyword, oldPos, newPos }
//     isRead: boolean;
//     emailSent: boolean;
//     createdAt: Date;
//     updatedAt: Date;
// }
//
// const AlertSettingSchema = new Schema<IAlertSettingDocument>(
//     {
//         userId: {type: Schema.Types.ObjectId, ref: "User", required: true, unique: true},
//         enabledAlerts: [{type: String}],
//         channel: {type: String, enum: ["in_app", "email", "both"], default: "in_app"},
//         emailAddress: {type: String},
//         rankDropThreshold: {type: Number, default: 5},
//         creditThreshold: {type: Number, default: 20},
//     },
//     {timestamps: true}
// );
//
// const AlertSchema = new Schema<IAlertDocument>(
//     {
//         userId: {type: Schema.Types.ObjectId, ref: "User", required: true},
//         type: {type: String, required: true},
//         title: {type: String, required: true},
//         message: {type: String, required: true},
//         data: {type: Schema.Types.Mixed},
//         isRead: {type: Boolean, default: false},
//         emailSent: {type: Boolean, default: false},
//     },
//     {timestamps: true}
// );
//
// AlertSchema.index({userId: 1, isRead: 1});
// AlertSchema.index({userId: 1, createdAt: -1});
//
// export const AlertSettingModel: Model<IAlertSettingDocument> =
//     mongoose.models.AlertSetting ??
//     mongoose.model<IAlertSettingDocument>("AlertSetting", AlertSettingSchema);
//
// export const AlertModel: Model<IAlertDocument> =
//     mongoose.models.Alert ??
//     mongoose.model<IAlertDocument>("Alert", AlertSchema);