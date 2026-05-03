// models/User.ts
import mongoose, {Schema, Document, Model} from "mongoose";

export interface IUserDocument extends Document {
    name: string;
    email: string;
    password?: string;
    image?: string;
    role: "super_admin" | "product_admin" | "user";
    plan: "free" | "silver" | "gold" | "diamond";
    subscriptionStatus: "active" | "inactive" | "cancelled" | "past_due" | "trialing";
    subscriptionId?: string;
    stripeCustomerId?: string;
    coinbaseCustomerId?: string;
    aiCreditsUsed: number;
    aiCreditsLimit: number;
    isActive: boolean;
    emailVerified?: Date | null;
    resetPasswordToken?: string;
    resetPasswordExpires?: Date;
    gscAccessToken?: string;
    gscRefreshToken?: string;
    gscConnectedAt?: Date;
    gscSiteUrl?: string;
    teamMembers?: {
        userId: mongoose.Types.ObjectId;
        role: "member" | "editor" | "admin";
        joinedAt: Date;
        aiCreditsAllocated: number;
        aiCreditsUsed: number;
        allowedPages: string[]; // empty = all pages, otherwise restrict to these paths
    }[];
    pendingInvites?: {
        email: string;
        role: "member" | "editor" | "admin";
        token: string;
        expiresAt: Date;
    }[];
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema = new Schema<IUserDocument>(
    {
        name: {type: String, required: true, trim: true, maxlength: 100},
        email: {type: String, required: true, unique: true, lowercase: true, trim: true},
        password: {type: String, select: false, minlength: 6},
        image: {type: String},
        role: {type: String, enum: ["super_admin", "product_admin", "user"], default: "user"},
        plan: {type: String, enum: ["free", "silver", "gold", "diamond"], default: "free"},
        subscriptionStatus: {
            type: String,
            enum: ["active", "inactive", "cancelled", "past_due", "trialing"],
            default: "inactive"
        },
        subscriptionId: {type: String},
        stripeCustomerId: {type: String},
        coinbaseCustomerId: {type: String},
        aiCreditsUsed: {type: Number, default: 0},
        aiCreditsLimit: {type: Number, default: 10},
        isActive: {type: Boolean, default: true},
        emailVerified: {type: Date, default: null},
        resetPasswordToken: {type: String},
        resetPasswordExpires: {type: Date},
        gscAccessToken: {type: String},
        gscRefreshToken: {type: String},
        gscConnectedAt: {type: Date},
        gscSiteUrl: {type: String},
        teamMembers: [{
            userId: {type: Schema.Types.ObjectId, ref: "User"},
            role: {type: String, enum: ["member", "editor", "admin"], default: "member"},
            joinedAt: {type: Date, default: Date.now},
            aiCreditsAllocated: {type: Number, default: 0},
            aiCreditsUsed: {type: Number, default: 0},
            allowedPages: {type: [String], default: []}, // empty = all pages allowed
        }],
        pendingInvites: [{
            email: {type: String, required: true},
            role: {type: String, enum: ["member", "editor", "admin"], default: "member"},
            token: {type: String, required: true},
            expiresAt: {type: Date, required: true},
        }],
    },
    {timestamps: true}
);

UserSchema.index({role: 1});
UserSchema.index({plan: 1});
UserSchema.index({stripeCustomerId: 1});
UserSchema.index({"teamMembers.userId": 1});

const UserModel: Model<IUserDocument> =
    mongoose.models.User ?? mongoose.model<IUserDocument>("User", UserSchema);

export default UserModel;
