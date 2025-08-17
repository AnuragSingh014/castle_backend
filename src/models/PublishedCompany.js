// models/PublishedCompany.js
import mongoose from 'mongoose';

const PublishedCompanySchema = new mongoose.Schema({
  originalUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  originalDashboardId: { type: mongoose.Schema.Types.ObjectId, ref: 'DashboardData', required: true },
  
  // Company Basic Info
  companyInfo: {
    companyName: String,
    companyType: String,
    industry: String,
    foundedYear: Number,
    employeeCount: Number,
    headquarters: String,
    website: String,
    description: String,
    contactInfo: {
      email: String,
      phone: String,
      address: String
    }
  },

  // Business Overview
  businessOverview: {
    businessModel: String,
    revenueStreams: String,
    industryOverview: String,
    fundUtilization: String,
    aboutPromoters: String,
    riskFactors: String,
    ipoIntermediaries: String
  },

  // Financial Data
  financialHighlights: {
    revenue: { fy22: Number, fy23: Number, fy24: Number, sept24: Number },
    ebitda: { fy22: Number, fy23: Number, fy24: Number, sept24: Number },
    financeCost: { fy22: Number, fy23: Number, fy24: Number, sept24: Number },
    depreciation: { fy22: Number, fy23: Number, fy24: Number, sept24: Number },
    pbt: { fy22: Number, fy23: Number, fy24: Number, sept24: Number },
    taxExpense: { fy22: Number, fy23: Number, fy24: Number, sept24: Number },
    pat: { fy22: Number, fy23: Number, fy24: Number, sept24: Number },
    ebitdaMargin: { fy22: Number, fy23: Number, fy24: Number, sept24: Number },
    patMargin: { fy22: Number, fy23: Number, fy24: Number, sept24: Number }
  },

  // Peer Analysis
  peerAnalysis: {
    companyNames: [String],
    revenue: [Number],
    basicEps: [Number],
    ebitda: [Number],
    pat: [Number],
    roe: [Number],
    currentPe: [Number],
    ipoPe: [Number]
  },

  // Shareholding
  shareholding: {
    promoters: { shares: Number, percentage: Number },
    public: { shares: Number, percentage: Number }
  },

  // Company Images
  images: [{
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    data: String, // base64 data
    uploadedAt: Date
  }],

  // Additional Information (if needed)
  informationSheet: { type: Object, default: {} },
  beneficialOwners: [Object],
  companyReferences: [Object],
  loanDetails: [Object],

  // Metadata
  publishedAt: { type: Date, default: Date.now },
  lastSyncedAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
  viewCount: { type: Number, default: 0 },
  
}, { timestamps: true });

// Indexes for better performance
PublishedCompanySchema.index({ 'companyInfo.companyName': 1 });
PublishedCompanySchema.index({ 'companyInfo.industry': 1 });
PublishedCompanySchema.index({ publishedAt: -1 });
PublishedCompanySchema.index({ originalUserId: 1 });

export default mongoose.model('PublishedCompany', PublishedCompanySchema);
