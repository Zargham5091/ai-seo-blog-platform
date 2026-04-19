import mongoose, { Schema, Document, Model } from "mongoose";

export interface IKeywordDocument extends Document {
  keyword: string;
  searchVolume: number;
  difficulty: number;
  cpc: number;
  trend: "up" | "down" | "stable";
  relatedKeywords: string[];
  userId: mongoose.Types.ObjectId;
  tenantId: mongoose.Types.ObjectId;
  isSaved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const KeywordSchema = new Schema<IKeywordDocument>(
  {
    keyword: { type: String, required: true, trim: true, lowercase: true },
    searchVolume: { type: Number, default: 0 },
    difficulty: { type: Number, default: 0, min: 0, max: 100 },
    cpc: { type: Number, default: 0 },
    trend: { type: String, enum: ["up", "down", "stable"], default: "stable" },
    relatedKeywords: [{ type: String }],
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    tenantId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    isSaved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

KeywordSchema.index({ userId: 1 });
KeywordSchema.index({ keyword: 1 });

const KeywordModel: Model<IKeywordDocument> =
  mongoose.models.Keyword ?? mongoose.model<IKeywordDocument>("Keyword", KeywordSchema);

export default KeywordModel;
