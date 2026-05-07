// models/Order.ts
// Order model supporting Phase 1 (WhatsApp/email) and Phase 2 (Stripe).

import mongoose, {Schema, Document, Model} from 'mongoose';

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
export type OrderChannel = 'whatsapp' | 'email' | 'stripe' | 'manual';

export interface IOrderItem {
    productId: mongoose.Types.ObjectId;
    productName: string;
    price: number;
    quantity: number;
    variant?: string;
    image?: string;
}

export interface IOrderDocument extends Document {
    userId: mongoose.Types.ObjectId;          // site owner who receives the order
    orderNumber: string;                       // human-readable: ORD-2025-0001
    channel: OrderChannel;
    status: OrderStatus;
    items: IOrderItem[];
    subtotal: number;
    total: number;
    currency: string;
    customer: {
        name: string;
        email?: string;
        phone?: string;
        address?: string;
    };
    notes?: string;
    stripeSessionId?: string;
    stripePaymentIntentId?: string;
    paidAt?: Date;
    shippedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>({
    productId: {type: Schema.Types.ObjectId, ref: 'Product', required: true},
    productName: {type: String, required: true},
    price: {type: Number, required: true},
    quantity: {type: Number, required: true, min: 1},
    variant: {type: String},
    image: {type: String},
}, {_id: false});

const OrderSchema = new Schema<IOrderDocument>({
    userId: {type: Schema.Types.ObjectId, ref: 'User', required: true, index: true},
    orderNumber: {type: String, required: true, unique: true},
    channel: {type: String, enum: ['whatsapp', 'email', 'stripe', 'manual'], default: 'manual'},
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
        default: 'pending',
    },
    items: [OrderItemSchema],
    subtotal: {type: Number, required: true},
    total: {type: Number, required: true},
    currency: {type: String, default: 'USD', uppercase: true},
    customer: {
        name: {type: String, required: true, trim: true},
        email: {type: String, trim: true, lowercase: true},
        phone: {type: String, trim: true},
        address: {type: String, trim: true},
    },
    notes: {type: String, maxlength: 1000},
    stripeSessionId: {type: String},
    stripePaymentIntentId: {type: String},
    paidAt: {type: Date},
    shippedAt: {type: Date},
}, {
    timestamps: true,
});

OrderSchema.index({userId: 1, createdAt: -1});
OrderSchema.index({userId: 1, status: 1});

// Auto-generate orderNumber before save
OrderSchema.pre('save', async function (next) {
    if (this.isNew && !this.orderNumber) {
        const year = new Date().getFullYear();
        const count = await (this.constructor as Model<IOrderDocument>).countDocuments({userId: this.userId});
        this.orderNumber = `ORD-${year}-${String(count + 1).padStart(4, '0')}`;
    }
    next();
});

const OrderModel: Model<IOrderDocument> =
    mongoose.models.Order ?? mongoose.model<IOrderDocument>('Order', OrderSchema);

export default OrderModel;