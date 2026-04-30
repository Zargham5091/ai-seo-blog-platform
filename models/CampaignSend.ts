import mongoose from "mongoose";

const CampaignSendSchema = new mongoose.Schema({
    campaignId: {type: mongoose.Schema.Types.ObjectId, ref: "NewsletterCampaign", required: true},
    tenantId: {type: String, required: true},
    email: {type: String, required: true},
    name: {type: String},
    status: {type: String, enum: ["sent", "failed", "opened", "clicked"], default: "sent"},
    sentAt: {type: Date, default: Date.now},
    openedAt: {type: Date},
    clickedAt: {type: Date},
    errorMessage: {type: String},
});

export const CampaignSendModel = mongoose.models.CampaignSend || mongoose.model("CampaignSend", CampaignSendSchema);