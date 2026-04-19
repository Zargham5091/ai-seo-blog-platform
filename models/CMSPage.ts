import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICMSPageDocument extends Document {
  slug: string;
  title: string;
  content: string;
  blocks: { id: string; type: string; content: Record<string, unknown>; order: number }[];
  seo: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
    ogImage?: string;
  };
  isPublished: boolean;
  lastEditedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CMSPageSchema = new Schema<ICMSPageDocument>(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    title: { type: String, required: true, trim: true },
    content: { type: String, default: "" },
    blocks: [{ type: Schema.Types.Mixed }],
    seo: {
      metaTitle: { type: String },
      metaDescription: { type: String },
      keywords: [{ type: String }],
      ogImage: { type: String },
    },
    isPublished: { type: Boolean, default: false },
    lastEditedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

const CMSPageModel: Model<ICMSPageDocument> =
  mongoose.models.CMSPage ?? mongoose.model<ICMSPageDocument>("CMSPage", CMSPageSchema);

export default CMSPageModel;
