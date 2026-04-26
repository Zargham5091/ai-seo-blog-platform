import mongoose, {Schema, Document, Model} from "mongoose";

export type SubscriptionStatus = "active" | "cancelled" | "past_due" | "trialing" | "paused";
export type BillingCycleInterval = "monthly" | "yearly" | "2year" | "3year";

export interface ISubscriptionDocument extends Document {
    userId: mongoose.Types.ObjectId;
    planSlug: string;
    status: SubscriptionStatus;
    billingCycle: BillingCycleInterval;
    amount: number;
    currency: string;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    coinbaseChargeId?: string;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    cancelledAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const SubscriptionSchema = new Schema<ISubscriptionDocument>(
    {
        userId: {type: Schema.Types.ObjectId, ref: "User", required: true},
        planSlug: {type: String, required: true},
        status: {type: String, enum: ["active", "cancelled", "past_due", "trialing", "paused"], default: "active"},
        billingCycle: {type: String, enum: ["monthly", "yearly", "2year", "3year"], default: "monthly"},
        amount: {type: Number, required: true, min: 0},
        currency: {type: String, default: "USD"},
        stripeCustomerId: {type: String},
        stripeSubscriptionId: {type: String},
        coinbaseChargeId: {type: String},
        currentPeriodStart: {type: Date, required: true},
        currentPeriodEnd: {type: Date, required: true},
        cancelledAt: {type: Date},
    },
    {timestamps: true}
);

SubscriptionSchema.index({userId: 1, status: 1});
SubscriptionSchema.index({stripeSubscriptionId: 1});
SubscriptionSchema.index({currentPeriodEnd: 1});

const SubscriptionModel: Model<ISubscriptionDocument> =
    mongoose.models.Subscription ??
    mongoose.model<ISubscriptionDocument>("Subscription", SubscriptionSchema);

export default SubscriptionModel;


// import mongoose, { Schema, Document, Model } from "mongoose";
//
// export interface ISubscriptionDocument extends Document {
//   userId: mongoose.Types.ObjectId;
//   plan: "free" | "silver" | "gold" | "diamond";
//   status: "active" | "inactive" | "cancelled" | "past_due" | "trialing";
//   billingCycle: "monthly" | "yearly";
//   paymentProvider: "stripe" | "coinbase" | "none";
//   stripeSubscriptionId?: string;
//   stripePriceId?: string;
//   stripeCustomerId?: string;
//   coinbaseChargeId?: string;
//   currentPeriodStart?: Date;
//   currentPeriodEnd?: Date;
//   cancelAtPeriodEnd: boolean;
//   cancelledAt?: Date;
//   amount: number;
//   currency: string;
//   createdAt: Date;
//   updatedAt: Date;
// }
//
// const SubscriptionSchema = new Schema<ISubscriptionDocument>(
//   {
//     userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
//     plan: { type: String, enum: ["free", "silver", "gold", "diamond"], required: true },
//     status: { type: String, enum: ["active", "inactive", "cancelled", "past_due", "trialing"], default: "inactive" },
//     billingCycle: { type: String, enum: ["monthly", "yearly"], default: "monthly" },
//     paymentProvider: { type: String, enum: ["stripe", "coinbase", "none"], default: "none" },
//     stripeSubscriptionId: { type: String },
//     stripePriceId: { type: String },
//     stripeCustomerId: { type: String },
//     coinbaseChargeId: { type: String },
//     currentPeriodStart: { type: Date },
//     currentPeriodEnd: { type: Date },
//     cancelAtPeriodEnd: { type: Boolean, default: false },
//     cancelledAt: { type: Date },
//     amount: { type: Number, default: 0 },
//     currency: { type: String, default: "USD" },
//   },
//   { timestamps: true }
// );
//
// SubscriptionSchema.index({ userId: 1 });
// SubscriptionSchema.index({ stripeSubscriptionId: 1 });
// SubscriptionSchema.index({ status: 1 });
//
// const SubscriptionModel: Model<ISubscriptionDocument> =
//   mongoose.models.Subscription ?? mongoose.model<ISubscriptionDocument>("Subscription", SubscriptionSchema);
//
// export default SubscriptionModel;
