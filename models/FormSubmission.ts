// models/FormSubmission.ts
// Stores contact form submissions from published sites.
// Linked to site owner via userId. No auth on submission (public endpoint).

import mongoose, {Schema, Document, Model} from 'mongoose';

export interface IFormSubmissionDocument extends Document {
    userId: mongoose.Types.ObjectId;  // site owner
    siteId: mongoose.Types.ObjectId;  // which site
    formType: 'contact' | 'newsletter' | 'reservation' | 'custom';
    fields: Record<string, string>;   // { name, email, message, ... }
    ipAddress?: string;
    isRead: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const FormSubmissionSchema = new Schema<IFormSubmissionDocument>({
    userId: {type: Schema.Types.ObjectId, ref: 'User', required: true, index: true},
    siteId: {type: Schema.Types.ObjectId, ref: 'UserSite', required: true},
    formType: {type: String, enum: ['contact', 'newsletter', 'reservation', 'custom'], default: 'contact'},
    fields: {type: Schema.Types.Mixed, required: true},
    ipAddress: {type: String},
    isRead: {type: Boolean, default: false},
}, {timestamps: true});

FormSubmissionSchema.index({userId: 1, createdAt: -1});
FormSubmissionSchema.index({userId: 1, isRead: 1});

const FormSubmissionModel: Model<IFormSubmissionDocument> =
    mongoose.models.FormSubmission ??
    mongoose.model<IFormSubmissionDocument>('FormSubmission', FormSubmissionSchema);

export default FormSubmissionModel;