import mongoose, {Schema, Document, Model} from "mongoose";

export type FeaturedRequestStatus = "pending" | "approved" | "rejected";

export interface IFeaturedPostRequestDocument extends Document {
    blogId: mongoose.Types.ObjectId;
    tenantId: mongoose.Types.ObjectId;
    requestedBy: mongoose.Types.ObjectId;
    status: FeaturedRequestStatus;
    note?: string;          // user's message to admin
    adminNote?: string;     // admin's reason for approval/rejection
    reviewedBy?: mongoose.Types.ObjectId;
    reviewedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const FeaturedPostRequestSchema = new Schema<IFeaturedPostRequestDocument>(
    {
        blogId: {type: Schema.Types.ObjectId, ref: "Blog", required: true},
        tenantId: {type: Schema.Types.ObjectId, ref: "User", required: true},
        requestedBy: {type: Schema.Types.ObjectId, ref: "User", required: true},
        status: {type: String, enum: ["pending", "approved", "rejected"], default: "pending"},
        note: {type: String, maxlength: 500},
        adminNote: {type: String, maxlength: 500},
        reviewedBy: {type: Schema.Types.ObjectId, ref: "User"},
        reviewedAt: {type: Date},
    },
    {timestamps: true}
);

FeaturedPostRequestSchema.index({blogId: 1});
FeaturedPostRequestSchema.index({tenantId: 1});
FeaturedPostRequestSchema.index({status: 1});

const FeaturedPostRequestModel: Model<IFeaturedPostRequestDocument> =
    mongoose.models.FeaturedPostRequest ??
    mongoose.model<IFeaturedPostRequestDocument>(
        "FeaturedPostRequest",
        FeaturedPostRequestSchema
    );

export default FeaturedPostRequestModel;
