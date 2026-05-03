// models/UserSession.ts
import mongoose, {Schema, Document, Model} from "mongoose";

export interface IUserSession extends Document {
    userId: mongoose.Types.ObjectId;
    sessionToken: string;
    ip: string;
    userAgent: string;
    browser: string;
    os: string;
    device: string;
    country?: string;
    lastActiveAt: Date;
    createdAt: Date;
    isRevoked: boolean;
}

const UserSessionSchema = new Schema<IUserSession>(
    {
        userId: {type: Schema.Types.ObjectId, ref: "User", required: true},
        sessionToken: {type: String, required: true, unique: true},
        ip: {type: String, default: "unknown"},
        userAgent: {type: String, default: "unknown"},
        browser: {type: String, default: "Unknown"},
        os: {type: String, default: "Unknown"},
        device: {type: String, default: "desktop"},
        country: {type: String},
        lastActiveAt: {type: Date, default: Date.now},
        isRevoked: {type: Boolean, default: false},
    },
    {timestamps: true}
);

UserSessionSchema.index({userId: 1, isRevoked: 1});
UserSessionSchema.index({sessionToken: 1});
UserSessionSchema.index({lastActiveAt: 1}, {expireAfterSeconds: 30 * 24 * 60 * 60}); // auto-delete after 30 days

const UserSessionModel: Model<IUserSession> =
    mongoose.models.UserSession ??
    mongoose.model<IUserSession>("UserSession", UserSessionSchema);

export default UserSessionModel;