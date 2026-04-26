import mongoose, {Schema, Document, Model} from "mongoose";

export interface IBlogDocument extends Document {
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    blocks: {
        id: string;
        type: string;
        content: Record<string, unknown>;
        order: number;
    }[];
    coverImage?: string;
    authorId: mongoose.Types.ObjectId;
    tenantId: mongoose.Types.ObjectId;
    status: "draft" | "published" | "scheduled" | "archived";
    seo: {
        metaTitle: string;
        metaDescription: string;
        keywords: string[];
        canonicalUrl?: string;
        ogImage?: string;
        ogTitle?: string;
        ogDescription?: string;
        structuredData?: Record<string, unknown>;
        seoScore: number;
        readabilityScore: number;
    };
    tags: string[];
    categories: string[];
    scheduledAt?: Date;
    publishedAt?: Date;
    viewCount: number;
    readTime: number;
    isAIGenerated: boolean;
    version: number;
    versions: {
        version: number;
        content: string;
        blocks: unknown[];
        savedAt: Date;
        savedBy: mongoose.Types.ObjectId;
    }[];
    createdAt: Date;
    updatedAt: Date;
    isFeatured: { type: Boolean, default: false },
    featuredAt: { type: Date },
}

const BlockSchema = new Schema({
    id: {type: String, required: true},
    type: {type: String, required: true},
    content: {type: Schema.Types.Mixed, default: {}},
    order: {type: Number, required: true},
}, {_id: false});

const SEOSchema = new Schema({
    metaTitle: {type: String, default: ""},
    metaDescription: {type: String, default: ""},
    keywords: [{type: String}],
    canonicalUrl: {type: String},
    ogImage: {type: String},
    ogTitle: {type: String},
    ogDescription: {type: String},
    structuredData: {type: Schema.Types.Mixed},
    seoScore: {type: Number, default: 0, min: 0, max: 100},
    readabilityScore: {type: Number, default: 0, min: 0, max: 100},
}, {_id: false});

const VersionSchema = new Schema({
    version: {type: Number, required: true},
    content: {type: String},
    blocks: [{type: Schema.Types.Mixed}],
    savedAt: {type: Date, default: Date.now},
    savedBy: {type: Schema.Types.ObjectId, ref: "User"},
}, {_id: false});

const BlogSchema = new Schema<IBlogDocument>(
    {
        title: {type: String, required: true, trim: true, maxlength: 200},
        slug: {type: String, required: true, lowercase: true, trim: true},
        excerpt: {type: String, default: "", maxlength: 500},
        content: {type: String, default: ""},
        blocks: [BlockSchema],
        coverImage: {type: String},
        authorId: {type: Schema.Types.ObjectId, ref: "User", required: true},
        tenantId: {type: Schema.Types.ObjectId, ref: "User", required: true},
        status: {type: String, enum: ["draft", "published", "scheduled", "archived"], default: "draft"},
        seo: {type: SEOSchema, default: () => ({})},
        tags: [{type: String, lowercase: true, trim: true}],
        categories: [{type: String}],
        scheduledAt: {type: Date},
        publishedAt: {type: Date},
        viewCount: {type: Number, default: 0},
        readTime: {type: Number, default: 1},
        isAIGenerated: {type: Boolean, default: false},
        version: {type: Number, default: 1},
        versions: [VersionSchema],
        isFeatured: {type: Boolean, default: false},
        featuredAt: {type: Date},
    },
    {timestamps: true}
);

BlogSchema.index({slug: 1, tenantId: 1}, {unique: true});
BlogSchema.index({authorId: 1});
BlogSchema.index({tenantId: 1});
BlogSchema.index({status: 1});
BlogSchema.index({tags: 1});
BlogSchema.index({createdAt: -1});
BlogSchema.index({title: "text", content: "text"});
BlogSchema.index({ isFeatured: 1, featuredAt: -1 });

const BlogModel: Model<IBlogDocument> =
    mongoose.models.Blog ?? mongoose.model<IBlogDocument>("Blog", BlogSchema);

export default BlogModel;
