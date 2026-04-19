import mongoose, {Schema, Document, Model} from "mongoose";

export interface ICategoryDocument extends Document {
    name: string;
    slug: string;
    description?: string;
    color?: string;
    tenantId: mongoose.Types.ObjectId;
    postCount: number;
    createdAt: Date;
    updatedAt: Date;
}

const CategorySchema = new Schema<ICategoryDocument>(
    {
        name: {type: String, required: true, trim: true, maxlength: 50},
        slug: {type: String, required: true, lowercase: true, trim: true},
        description: {type: String, maxlength: 200},
        color: {type: String, default: "#4F46E5", match: /^#[0-9a-fA-F]{6}$/},
        tenantId: {type: Schema.Types.ObjectId, ref: "User", required: true},
        postCount: {type: Number, default: 0},
    },
    {timestamps: true}
);

// Unique slug per tenant
CategorySchema.index({slug: 1, tenantId: 1}, {unique: true});
CategorySchema.index({tenantId: 1});

const CategoryModel: Model<ICategoryDocument> =
    mongoose.models.Category ??
    mongoose.model<ICategoryDocument>("Category", CategorySchema);

export default CategoryModel;
