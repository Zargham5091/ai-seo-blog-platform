import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISubscriptionDocument extends Document {
  userId: mongoose.Types.ObjectId;
  plan: "free" | "silver" | "gold" | "diamond";
  status: "active" | "inactive" | "cancelled" | "past_due" | "trialing";
  billingCycle: "monthly" | "yearly";
  paymentProvider: "stripe" | "coinbase" | "none";
  stripeSubscriptionId?: string;
  stripePriceId?: string;
  stripeCustomerId?: string;
  coinbaseChargeId?: string;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd: boolean;
  cancelledAt?: Date;
  amount: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema = new Schema<ISubscriptionDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    plan: { type: String, enum: ["free", "silver", "gold", "diamond"], required: true },
    status: { type: String, enum: ["active", "inactive", "cancelled", "past_due", "trialing"], default: "inactive" },
    billingCycle: { type: String, enum: ["monthly", "yearly"], default: "monthly" },
    paymentProvider: { type: String, enum: ["stripe", "coinbase", "none"], default: "none" },
    stripeSubscriptionId: { type: String },
    stripePriceId: { type: String },
    stripeCustomerId: { type: String },
    coinbaseChargeId: { type: String },
    currentPeriodStart: { type: Date },
    currentPeriodEnd: { type: Date },
    cancelAtPeriodEnd: { type: Boolean, default: false },
    cancelledAt: { type: Date },
    amount: { type: Number, default: 0 },
    currency: { type: String, default: "USD" },
  },
  { timestamps: true }
);

SubscriptionSchema.index({ userId: 1 });
SubscriptionSchema.index({ stripeSubscriptionId: 1 });
SubscriptionSchema.index({ status: 1 });

const SubscriptionModel: Model<ISubscriptionDocument> =
  mongoose.models.Subscription ?? mongoose.model<ISubscriptionDocument>("Subscription", SubscriptionSchema);

export default SubscriptionModel;
