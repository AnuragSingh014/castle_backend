// models/InvestorData.js
import mongoose from 'mongoose';

const AuditEntrySchema = new mongoose.Schema({
  actorType: { type: String, enum: ['investor','admin'], required: true },
  actorId: { type: String }, // investorId or admin username
  action: { type: String, required: true },
  meta: { type: Object, default: {} },
  at: { type: Date, default: Date.now }
}, { _id: false });

const InvestorDataSchema = new mongoose.Schema({
  investorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Investor', required: true, unique: true },
  
  // Basic investor information (will be filled later based on your requirements)
  basicInfo: { type: Object, default: {} },
  investmentPreferences: { type: Object, default: {} },
  financialInfo: { type: Object, default: {} },
  documents: { type: Object, default: {} },
  
  // Metadata
  lastUpdated: { type: Date, default: Date.now },
  completionPercentage: { type: Number, default: 0 },
  isComplete: { type: Boolean, default: false },
  audit: [AuditEntrySchema]
  
}, { timestamps: true });

InvestorDataSchema.index({ investorId: 1 }, { unique: true });
InvestorDataSchema.index({ lastUpdated: -1 });

export default mongoose.model('InvestorData', InvestorDataSchema);
