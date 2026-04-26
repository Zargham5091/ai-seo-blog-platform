import mongoose, {Schema, Document, Model} from "mongoose";

export type ContentStatus = "idea" | "outline" | "draft" | "review" | "scheduled" | "published";
export type ContentType = "blog" | "social" | "newsletter" | "video" | "podcast" | "infographic";

export interface IContentCalendarDocument extends Document {
    tenantId: mongoose.Types.ObjectId;
    title: string;
    contentType: ContentType;
    status: ContentStatus;
    assignedTo?: mongoose.Types.ObjectId;
    targetKeyword?: string;
    targetAudience?: string;
    notes?: string;
    blogId?: mongoose.Types.ObjectId;
    scheduledDate: Date;
    publishedDate?: Date;
    tags: string[];
    color: string;
    createdAt: Date;
    updatedAt: Date;
}

const ContentCalendarSchema = new Schema<IContentCalendarDocument>(
    {
        tenantId: {type: Schema.Types.ObjectId, ref: "User", required: true},
        title: {type: String, required: true, trim: true, maxlength: 200},
        contentType: {
            type: String,
            enum: ["blog", "social", "newsletter", "video", "podcast", "infographic"],
            default: "blog"
        },
        status: {type: String, enum: ["idea", "outline", "draft", "review", "scheduled", "published"], default: "idea"},
        assignedTo: {type: Schema.Types.ObjectId, ref: "User"},
        targetKeyword: {type: String},
        targetAudience: {type: String},
        notes: {type: String, maxlength: 1000},
        blogId: {type: Schema.Types.ObjectId, ref: "Blog"},
        scheduledDate: {type: Date, required: true},
        publishedDate: {type: Date},
        tags: [{type: String}],
        color: {type: String, default: "#4F46E5"},
    },
    {timestamps: true}
);

ContentCalendarSchema.index({tenantId: 1, scheduledDate: 1});
ContentCalendarSchema.index({tenantId: 1, status: 1});

const ContentCalendarModel: Model<IContentCalendarDocument> =
    mongoose.models.ContentCalendar ??
    mongoose.model<IContentCalendarDocument>("ContentCalendar", ContentCalendarSchema);

export default ContentCalendarModel;
