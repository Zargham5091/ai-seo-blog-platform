// =============================================================================
// models/ComponentVersion.ts
// Tracks every save of a PlanComponent for version history in super admin
// =============================================================================

import mongoose, {Schema, Document, Model} from "mongoose";

export interface IComponentVersionDocument extends Document {
    componentId: mongoose.Types.ObjectId;   // ref PlanComponent._id
    componentKey: string;                   // denormalized for fast lookup
    version: number;                        // auto-incremented
    savedBy: mongoose.Types.ObjectId;       // ref User._id
    // Snapshot of the component at save time
    snapshot: {
        name: string;
        htmlTemplate: string;
        cssCode: string;
        jsCode: string;
        propsSchema: unknown[];
        description: string;
    };
    changeNote?: string;                    // optional note from admin
    createdAt: Date;
}

const ComponentVersionSchema = new Schema<IComponentVersionDocument>(
    {
        componentId: {type: Schema.Types.ObjectId, ref: "PlanComponent", required: true},
        componentKey: {type: String, required: true},
        version: {type: Number, required: true},
        savedBy: {type: Schema.Types.ObjectId, ref: "User", required: true},
        snapshot: {
            name: {type: String},
            htmlTemplate: {type: String},
            cssCode: {type: String},
            jsCode: {type: String},
            propsSchema: [{type: Schema.Types.Mixed}],
            description: {type: String},
        },
        changeNote: {type: String, maxlength: 200},
    },
    {timestamps: {createdAt: true, updatedAt: false}}
);

ComponentVersionSchema.index({componentId: 1, version: -1});
ComponentVersionSchema.index({componentKey: 1});

const ComponentVersionModel: Model<IComponentVersionDocument> =
    mongoose.models.ComponentVersion ??
    mongoose.model<IComponentVersionDocument>("ComponentVersion", ComponentVersionSchema);

export default ComponentVersionModel;

