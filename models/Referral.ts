import mongoose, {Schema, Document, Model} from "mongoose";

export type ReferralStatus = "pending" | "converted" | "paid";
export type PayoutStatus = "pending" | "processing" | "paid" | "failed";

export interface IReferralDocument extends Document {
    referrerId: mongoose.Types.ObjectId;   // user who referred
    referredId?: mongoose.Types.ObjectId;  // user who signed up
    code: string;                          // unique referral code e.g. "ZARGHAM20"
    email?: string;                        // email of referred person (before signup)
    status: ReferralStatus;
    // Commission
    commissionPercent: number;             // e.g. 20 = 20% of first payment
    commissionAmount: number;              // actual USD amount earned
    // Which plan they converted on
    convertedPlan?: string;
    convertedAmount?: number;
    convertedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface IReferralPayoutDocument extends Document {
    userId: mongoose.Types.ObjectId;
    amount: number;
    currency: string;
    status: PayoutStatus;
    referralIds: mongoose.Types.ObjectId[];
    paymentMethod: string;   // "paypal" | "bank" | "crypto"
    paymentDetails: string;  // email or address
    processedAt?: Date;
    note?: string;
    createdAt: Date;
    updatedAt: Date;
}

const ReferralSchema = new Schema<IReferralDocument>(
    {
        referrerId: {type: Schema.Types.ObjectId, ref: "User", required: true},
        referredId: {type: Schema.Types.ObjectId, ref: "User"},
        code: {type: String, required: true, unique: true, uppercase: true, trim: true},
        email: {type: String, lowercase: true, trim: true},
        status: {type: String, enum: ["pending", "converted", "paid"], default: "pending"},
        commissionPercent: {type: Number, default: 20},
        commissionAmount: {type: Number, default: 0},
        convertedPlan: {type: String},
        convertedAmount: {type: Number},
        convertedAt: {type: Date},
    },
    {timestamps: true}
);

const ReferralPayoutSchema = new Schema<IReferralPayoutDocument>(
    {
        userId: {type: Schema.Types.ObjectId, ref: "User", required: true},
        amount: {type: Number, required: true, min: 0},
        currency: {type: String, default: "USD"},
        status: {type: String, enum: ["pending", "processing", "paid", "failed"], default: "pending"},
        referralIds: [{type: Schema.Types.ObjectId, ref: "Referral"}],
        paymentMethod: {type: String},
        paymentDetails: {type: String},
        processedAt: {type: Date},
        note: {type: String},
    },
    {timestamps: true}
);

ReferralSchema.index({referrerId: 1});
ReferralSchema.index({code: 1});
ReferralSchema.index({status: 1});

ReferralPayoutSchema.index({userId: 1, status: 1});

export const ReferralModel: Model<IReferralDocument> =
    mongoose.models.Referral ??
    mongoose.model<IReferralDocument>("Referral", ReferralSchema);

export const ReferralPayoutModel: Model<IReferralPayoutDocument> =
    mongoose.models.ReferralPayout ??
    mongoose.model<IReferralPayoutDocument>("ReferralPayout", ReferralPayoutSchema);

// import mongoose, {Schema, Document, Model} from "mongoose";
//
// export type ReferralStatus = "pending" | "converted" | "paid";
// export type PayoutStatus = "pending" | "processing" | "paid" | "failed";
//
// export interface IReferralDocument extends Document {
//     referrerId: mongoose.Types.ObjectId;   // user who referred
//     referredId?: mongoose.Types.ObjectId;  // user who signed up
//     code: string;                          // unique referral code e.g. "ZARGHAM20"
//     email?: string;                        // email of referred person (before signup)
//     status: ReferralStatus;
//     // Commission
//     commissionPercent: number;             // e.g. 20 = 20% of first payment
//     commissionAmount: number;              // actual USD amount earned
//     // Which plan they converted on
//     convertedPlan?: string;
//     convertedAmount?: number;
//     convertedAt?: Date;
//     createdAt: Date;
//     updatedAt: Date;
// }
//
// export interface IReferralPayoutDocument extends Document {
//     userId: mongoose.Types.ObjectId;
//     amount: number;
//     currency: string;
//     status: PayoutStatus;
//     referralIds: mongoose.Types.ObjectId[];
//     paymentMethod: string;   // "paypal" | "bank" | "crypto"
//     paymentDetails: string;  // email or address
//     processedAt?: Date;
//     note?: string;
//     createdAt: Date;
//     updatedAt: Date;
// }
//
// const ReferralSchema = new Schema<IReferralDocument>(
//     {
//         referrerId: {type: Schema.Types.ObjectId, ref: "User", required: true},
//         referredId: {type: Schema.Types.ObjectId, ref: "User"},
//         code: {type: String, required: true, unique: true, uppercase: true, trim: true},
//         email: {type: String, lowercase: true, trim: true},
//         status: {type: String, enum: ["pending", "converted", "paid"], default: "pending"},
//         commissionPercent: {type: Number, default: 20},
//         commissionAmount: {type: Number, default: 0},
//         convertedPlan: {type: String},
//         convertedAmount: {type: Number},
//         convertedAt: {type: Date},
//     },
//     {timestamps: true}
// );
//
// const ReferralPayoutSchema = new Schema<IReferralPayoutDocument>(
//     {
//         userId: {type: Schema.Types.ObjectId, ref: "User", required: true},
//         amount: {type: Number, required: true, min: 0},
//         currency: {type: String, default: "USD"},
//         status: {type: String, enum: ["pending", "processing", "paid", "failed"], default: "pending"},
//         referralIds: [{type: Schema.Types.ObjectId, ref: "Referral"}],
//         paymentMethod: {type: String},
//         paymentDetails: {type: String},
//         processedAt: {type: Date},
//         note: {type: String},
//     },
//     {timestamps: true}
// );
//
// ReferralSchema.index({referrerId: 1});
// ReferralSchema.index({code: 1});
// ReferralSchema.index({status: 1});
//
// ReferralPayoutSchema.index({userId: 1, status: 1});
//
// export const ReferralModel: Model<IReferralDocument> =
//     mongoose.models.Referral ??
//     mongoose.model<IReferralDocument>("Referral", ReferralSchema);
//
// export const ReferralPayoutModel: Model<IReferralPayoutDocument> =
//     mongoose.models.ReferralPayout ??
//     mongoose.model<IReferralPayoutDocument>("ReferralPayout", ReferralPayoutSchema);