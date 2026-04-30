import mongoose, {Schema, Document, Model} from "mongoose";

export interface ISupportTicket extends Document {
    sessionId: string;             // anonymous chat session
    userId?: mongoose.Types.ObjectId; // if logged in
    visitorEmail?: string;
    messages: {
        role: "user" | "assistant";
        content: string;
        createdAt: Date;
    }[];
    status: "open" | "pending_admin" | "replied" | "closed";
    adminReply?: string;
    adminRepliedAt?: Date;
    adminRepliedBy?: mongoose.Types.ObjectId;
    subject?: string;              // auto-extracted from first message
    createdAt: Date;
    updatedAt: Date;
}

const SupportTicketSchema = new Schema<ISupportTicket>(
    {
        sessionId: {type: String, required: true, index: true},
        userId: {type: Schema.Types.ObjectId, ref: "User"},
        visitorEmail: {type: String},
        messages: [{
            role: {type: String, enum: ["user", "assistant"], required: true},
            content: {type: String, required: true},
            createdAt: {type: Date, default: Date.now},
        }],
        status: {type: String, enum: ["open", "pending_admin", "replied", "closed"], default: "open"},
        adminReply: {type: String},
        adminRepliedAt: {type: Date},
        adminRepliedBy: {type: Schema.Types.ObjectId, ref: "User"},
        subject: {type: String},
    },
    {timestamps: true}
);

SupportTicketSchema.index({status: 1, createdAt: -1});
SupportTicketSchema.index({userId: 1});

const SupportTicketModel: Model<ISupportTicket> =
    mongoose.models.SupportTicket ??
    mongoose.model<ISupportTicket>("SupportTicket", SupportTicketSchema);

export default SupportTicketModel;