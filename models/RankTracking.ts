import mongoose, {Schema, Document, Model} from "mongoose";

export interface IRankSnapshotDocument {
    date: Date;
    position: number | null;   // null = not ranking in top 100
    url?: string;              // which URL is ranking
    searchEngine: "google" | "bing";
    location: string;          // "us" | "uk" | "global" etc
}

export interface IRankTrackingDocument extends Document {
    userId: mongoose.Types.ObjectId;
    tenantId: mongoose.Types.ObjectId;
    keyword: string;
    targetUrl?: string;        // URL user wants to rank
    targetPosition?: number;   // Goal position e.g. top 3
    currentPosition: number | null;
    previousPosition: number | null;
    bestPosition: number | null;
    searchVolume?: number;
    searchEngine: "google" | "bing";
    location: string;
    snapshots: IRankSnapshotDocument[];
    isActive: boolean;
    lastCheckedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const SnapshotSchema = new Schema<IRankSnapshotDocument>({
    date: {type: Date, required: true},
    position: {type: Number, default: null},
    url: {type: String},
    searchEngine: {type: String, enum: ["google", "bing"], default: "google"},
    location: {type: String, default: "us"},
}, {_id: false});

const RankTrackingSchema = new Schema<IRankTrackingDocument>(
    {
        userId: {type: Schema.Types.ObjectId, ref: "User", required: true},
        tenantId: {type: Schema.Types.ObjectId, ref: "User", required: true},
        keyword: {type: String, required: true, trim: true},
        targetUrl: {type: String},
        targetPosition: {type: Number},
        currentPosition: {type: Number, default: null},
        previousPosition: {type: Number, default: null},
        bestPosition: {type: Number, default: null},
        searchVolume: {type: Number},
        searchEngine: {type: String, enum: ["google", "bing"], default: "google"},
        location: {type: String, default: "us"},
        snapshots: {type: [SnapshotSchema], default: []},
        isActive: {type: Boolean, default: true},
        lastCheckedAt: {type: Date},
    },
    {timestamps: true}
);

RankTrackingSchema.index({tenantId: 1, keyword: 1});
RankTrackingSchema.index({tenantId: 1, isActive: 1});

const RankTrackingModel: Model<IRankTrackingDocument> =
    mongoose.models.RankTracking ??
    mongoose.model<IRankTrackingDocument>("RankTracking", RankTrackingSchema);

export default RankTrackingModel;


// import mongoose, {Schema, Document, Model} from "mongoose";
//
// export interface IRankSnapshotDocument {
//     date: Date;
//     position: number | null;   // null = not ranking in top 100
//     url?: string;              // which URL is ranking
//     searchEngine: "google" | "bing";
//     location: string;          // "us" | "uk" | "global" etc
// }
//
// export interface IRankTrackingDocument extends Document {
//     userId: mongoose.Types.ObjectId;
//     tenantId: mongoose.Types.ObjectId;
//     keyword: string;
//     targetUrl?: string;        // URL user wants to rank
//     targetPosition?: number;   // Goal position e.g. top 3
//     currentPosition: number | null;
//     previousPosition: number | null;
//     bestPosition: number | null;
//     searchVolume?: number;
//     searchEngine: "google" | "bing";
//     location: string;
//     snapshots: IRankSnapshotDocument[];
//     isActive: boolean;
//     lastCheckedAt?: Date;
//     createdAt: Date;
//     updatedAt: Date;
// }
//
// const SnapshotSchema = new Schema<IRankSnapshotDocument>({
//     date: {type: Date, required: true},
//     position: {type: Number, default: null},
//     url: {type: String},
//     searchEngine: {type: String, enum: ["google", "bing"], default: "google"},
//     location: {type: String, default: "us"},
// }, {_id: false});
//
// const RankTrackingSchema = new Schema<IRankTrackingDocument>(
//     {
//         userId: {type: Schema.Types.ObjectId, ref: "User", required: true},
//         tenantId: {type: Schema.Types.ObjectId, ref: "User", required: true},
//         keyword: {type: String, required: true, trim: true},
//         targetUrl: {type: String},
//         targetPosition: {type: Number},
//         currentPosition: {type: Number, default: null},
//         previousPosition: {type: Number, default: null},
//         bestPosition: {type: Number, default: null},
//         searchVolume: {type: Number},
//         searchEngine: {type: String, enum: ["google", "bing"], default: "google"},
//         location: {type: String, default: "us"},
//         snapshots: {type: [SnapshotSchema], default: []},
//         isActive: {type: Boolean, default: true},
//         lastCheckedAt: {type: Date},
//     },
//     {timestamps: true}
// );
//
// RankTrackingSchema.index({tenantId: 1, keyword: 1});
// RankTrackingSchema.index({tenantId: 1, isActive: 1});
//
// const RankTrackingModel: Model<IRankTrackingDocument> =
//     mongoose.models.RankTracking ??
//     mongoose.model<IRankTrackingDocument>("RankTracking", RankTrackingSchema);
//
// export default RankTrackingModel;