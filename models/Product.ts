// models/Product.ts
// Simple product catalog for SiteCraft ecommerce sites.
// Supports Phase 1 (WhatsApp/email orders) and Phase 2 (Stripe).

import mongoose, {Schema, Document, Model} from 'mongoose';

export interface IProductDocument extends Document {
    userId: mongoose.Types.ObjectId;        // site owner
    name: string;
    description?: string;
    price: number;                           // in smallest currency unit (cents) for Stripe compat
    comparePrice?: number;                   // original price for sale display
    currency: string;                        // 'USD', 'PKR', etc.
    images: string[];                        // Cloudinary URLs
    category?: string;
    tags?: string[];
    variants?: {
        name: string;                          // e.g. 'Size', 'Color'
        options: string[];                     // e.g. ['S','M','L']
    }[];
    sku?: string;
    stock: number;                           // -1 = unlimited
    isActive: boolean;
    isFeatured: boolean;
    stripeProductId?: string;               // set in Phase 2
    stripePriceId?: string;                 // set in Phase 2
    createdAt: Date;
    updatedAt: Date;
}

const VariantSchema = new Schema({
    name: {type: String, required: true},
    options: [{type: String}],
}, {_id: false});

const ProductSchema = new Schema<IProductDocument>({
    userId: {type: Schema.Types.ObjectId, ref: 'User', required: true, index: true},
    name: {type: String, required: true, trim: true, maxlength: 200},
    description: {type: String, maxlength: 2000},
    price: {type: Number, required: true, min: 0},
    comparePrice: {type: Number, min: 0},
    currency: {type: String, default: 'USD', uppercase: true, maxlength: 3},
    images: [{type: String}],
    category: {type: String, trim: true, maxlength: 100},
    tags: [{type: String, trim: true}],
    variants: [VariantSchema],
    sku: {type: String, trim: true, maxlength: 100},
    stock: {type: Number, default: -1},   // -1 = unlimited
    isActive: {type: Boolean, default: true},
    isFeatured: {type: Boolean, default: false},
    stripeProductId: {type: String},
    stripePriceId: {type: String},
}, {
    timestamps: true,
});

// Compound index for listing user's products efficiently
ProductSchema.index({userId: 1, isActive: 1, createdAt: -1});

const ProductModel: Model<IProductDocument> =
    mongoose.models.Product ?? mongoose.model<IProductDocument>('Product', ProductSchema);

export default ProductModel;