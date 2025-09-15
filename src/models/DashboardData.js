// models/DashboardData.js
import mongoose from 'mongoose';

const ApprovalSchema = new mongoose.Schema({
  // admin gate per section
  information: { type: String, enum: ['open','locked','approved'], default: 'open' },
  overview: { type: String, enum: ['open','locked','approved'], default: 'open' },
  informationSheet: { type: String, enum: ['open','locked','approved'], default: 'locked' },
  beneficialOwnerCertification: { type: String, enum: ['open','locked','approved'], default: 'locked' },
  ddform: { type: String, enum: ['open','locked','approved'], default: 'locked' },
  loanDetails: { type: String, enum: ['open','locked','approved'], default: 'locked' },
  companyReferences: { type: String, enum: ['open','locked','approved'], default: 'locked' },
  ceoDashboard: { type: String, enum: ['open','locked','approved'], default: 'locked' },
  cfoDashboard: { type: String, enum: ['open','locked','approved'], default: 'locked' },
  // ✅ NEW: Add loan request approval field for gating
  loanRequest: { type: String, enum: ['open','locked','approved'], default: 'locked' },
}, { _id: false });

const AuditEntrySchema = new mongoose.Schema({
  actorType: { type: String, enum: ['user','admin'], required: true },
  actorId: { type: String }, // userId or admin username
  action: { type: String, required: true },
  meta: { type: Object, default: {} },
  at: { type: Date, default: Date.now }
}, { _id: false });

const DashboardDataSchema = new mongoose.Schema({
  companySignature: {
    data: String, // base64 encoded image
    founderName: String,
    founderTitle: String,
    filename: String,
    mimetype: String,
    size: Number,
    uploadedAt: { type: Date, default: Date.now }
  },
   
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  publicAmount: { type: Number, default: 0 }, 
  
  // Sections
  isDisplayedOnWebsite: { type: Boolean, default: false },
  
  // Add these fields to your existing DashboardData schema
  ceoDashboard: { type: Object, default: {} },
  cfoDashboard: { type: Object, default: {} },
  
  information: {
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
    },
    businessOverview: {
      businessModel: String,
      marketOpportunity: String,
      growthStrategy: String
    }
  },

  overview: {
    businessOverview: String,
    revenueStreams: String,
    industryOverview: String,
    fundUtilization: String,
    aboutPromoters: String,
    riskFactors: String,
    ipoIntermediaries: String,
    images: [{
      filename: String,
      originalName: String, 
      mimetype: String, 
      size: Number,
      data: String, // ✅ Add this field to store base64 data
      uploadedAt: { type: Date, default: Date.now }
    }],
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
    shareholding: {
      promoters: { shares: Number, percentage: Number },
      public: { shares: Number, percentage: Number }
    }
  },

  // if you need detailed Information Sheet fields, add here
  informationSheet: { type: Object, default: {} },

  pdfDocument: {
    title: String,
    description: String,
    originalName: String,
    mimetype: String,
    size: Number,
    data: String, // base64 encoded PDF
    uploadedAt: { type: Date, default: Date.now }
  },
  
  beneficialOwnerCertification: {
    owners: [{
      name: String,
      nationality: String,
      passportNumber: String,
      dateOfBirth: Date,
      residentialAddress: String,
      percentageOwnership: Number,
      sourceOfFunds: String,
      documents: [{
        type: String,
        filename: String, 
        originalName: String, 
        mimetype: String, 
        size: Number, 
        path: String, 
        uploadedAt: { type: Date, default: Date.now }
      }]
    }],
    certificationDate: { type: Date, default: Date.now },
    isCertified: { type: Boolean, default: false }
  },

  companyReferences: {
    references: [{
      companyName: String,
      contactPerson: String,
      position: String,
      email: String,
      phone: String,
      relationship: String,
      yearsOfRelationship: Number,
      description: String
    }],
    totalReferences: { type: Number, default: 0 }
  },

  ddform: {
    businessDetails: {
      legalStructure: String,
      registrationNumber: String,
      taxIdentification: String,
      businessLicense: String
    },
    financialInformation: {
      annualRevenue: Number,
      profitMargin: Number,
      debtRatio: Number,
      cashFlow: Number
    },
    compliance: {
      regulatoryCompliance: Boolean,
      environmentalCompliance: Boolean,
      laborCompliance: Boolean,
      taxCompliance: Boolean
    },
    riskAssessment: {
      marketRisk: { type: String, enum: ['Low','Medium','High'] },
      operationalRisk: { type: String, enum: ['Low','Medium','High'] },
      financialRisk: { type: String, enum: ['Low','Medium','High'] },
      complianceRisk: { type: String, enum: ['Low','Medium','High'] }
    },
    documents: [{
      type: String,
      filename: String, 
      originalName: String, 
      mimetype: String, 
      size: Number, 
      path: String, 
      uploadedAt: { type: Date, default: Date.now }
    }]
  },

  // ✅ NEW: Add loan request section with all required fields
  loanRequest: {
    loanAmountRequired: { type: Number, default: 0 },
    expectedROI: { type: Number, default: 0 }, // Can be percentage like 12.5
    tenure: { type: Number, default: 0 }, // In months or years
    tenureUnit: { type: String, enum: ['months', 'years'], default: 'months' },
    loanType: { type: String, default: '' }, // First dropdown (string)
    loanPurpose: { type: String, default: '' }, // Second dropdown (string)
    submittedAt: { type: Date, default: null },
    status: { type: String, enum: ['draft', 'submitted', 'reviewed'], default: 'draft' }
  },

  loanDetails: {
    loans: [{
      loanType: String,
      amount: Number,
      currency: { type: String, default: 'INR' },
      interestRate: Number,
      term: Number,
      purpose: String,
      collateral: {
        type: {
          type: String,    // ✅ Fixed: type: { type: String }
          default: ''
        },
        value: {
          type: Number,
          default: 0
        },
        description: {
          type: String,
          default: ''
        }
      },
      repaymentSchedule: {
        frequency: { type: String, enum: ['Monthly','Quarterly','Annually'], default: 'Monthly' },
        startDate: Date,
        endDate: Date
      },
      guarantors: [{
        name: String,
        relationship: String,
        netWorth: Number,
        contactInfo: { email: String, phone: String }
      }],
      documents: [{
        type: String,
        filename: String, 
        originalName: String, 
        mimetype: String, 
        size: Number, 
        path: String, 
        uploadedAt: { type: Date, default: Date.now }
      }],
      // Frontend data for admin viewing
      _frontend_data: {
        bank: String,
        closingBalance: Number,
        emi: Number,
        yearOfSanction: String
      }
    }],
    currentDate: Date,
    _summary: {
      totalSanctioned: Number,
      totalClosingBalance: Number,
      totalEMI: Number,
      completedRows: Number,
      totalRows: Number,
      progress: Number
    }
  },

  approvals: { type: ApprovalSchema, default: () => ({}) },

  lastUpdated: { type: Date, default: Date.now },
  completionPercentage: { type: Number, default: 0 },
  isComplete: { type: Boolean, default: false },

  audit: [AuditEntrySchema]
}, { timestamps: true });

DashboardDataSchema.index({ userId: 1 }, { unique: true });
DashboardDataSchema.index({ lastUpdated: -1 });

export default mongoose.model('DashboardData', DashboardDataSchema);
