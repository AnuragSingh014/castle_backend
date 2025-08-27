// models/InvestorDashboardData.js
import mongoose from 'mongoose';

const MonthlyDataSchema = new mongoose.Schema({
    apr: { type: Number, default: 0 },
    may: { type: Number, default: 0 },
    jun: { type: Number, default: 0 },
    jul: { type: Number, default: 0 },
    aug: { type: Number, default: 0 },
    sep: { type: Number, default: 0 },
    oct: { type: Number, default: 0 },
    nov: { type: Number, default: 0 },
    dec: { type: Number, default: 0 },
    jan: { type: Number, default: 0 },
    feb: { type: Number, default: 0 },
    mar: { type: Number, default: 0 }
  }, { _id: false });
  
// models/InvestorDashboardData.js
const FieldWithTypesSchema = new mongoose.Schema({
  actual: { type: MonthlyDataSchema, default: () => ({}) },
  target: { type: MonthlyDataSchema, default: () => ({}) },
  lastYear: { type: MonthlyDataSchema, default: () => ({}) }
}, { _id: false });

const FieldActualOnlySchema = new mongoose.Schema({
  actual: { type: MonthlyDataSchema, default: () => ({}) }
}, { _id: false });

// CEO Dashboard Schema - Updated


const InvestorProfileSchema = new mongoose.Schema({
    name: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' }
  }, { _id: false });

// Monthly data schema (Apr to Mar)


// CEO Dashboard Schema
const CEODashboardSchema = new mongoose.Schema({
    // Financial Performance with Actual/Target/LastYear
    revenue: { type: FieldWithTypesSchema, default: () => ({}) },
    costOfGoodsSold: { type: FieldWithTypesSchema, default: () => ({}) },
    operatingExpenses: { type: FieldWithTypesSchema, default: () => ({}) },
    otherIncome: { type: FieldWithTypesSchema, default: () => ({}) },
    financeExpense: { type: FieldWithTypesSchema, default: () => ({}) },
    
    // Product sales with Actual/Target only
    product1Sales: { 
      actual: { type: MonthlyDataSchema, default: () => ({}) },
      target: { type: MonthlyDataSchema, default: () => ({}) }
    },
    product2Sales: { 
      actual: { type: MonthlyDataSchema, default: () => ({}) },
      target: { type: MonthlyDataSchema, default: () => ({}) }
    },
    product3Sales: { 
      actual: { type: MonthlyDataSchema, default: () => ({}) },
      target: { type: MonthlyDataSchema, default: () => ({}) }
    },
    product4Sales: { 
      actual: { type: MonthlyDataSchema, default: () => ({}) },
      target: { type: MonthlyDataSchema, default: () => ({}) }
    },
    product5Sales: { 
      actual: { type: MonthlyDataSchema, default: () => ({}) },
      target: { type: MonthlyDataSchema, default: () => ({}) }
    },
    
    // Employee data (Actual only)
    employeeCost: { type: FieldActualOnlySchema, default: () => ({}) },
    headcountMale: { type: FieldActualOnlySchema, default: () => ({}) },
    headcountFemale: { type: FieldActualOnlySchema, default: () => ({}) },
    
    // Cash flow data (Actual only)
    netOperatingCashFlow: { type: FieldActualOnlySchema, default: () => ({}) },
    netFinancingCashFlow: { type: FieldActualOnlySchema, default: () => ({}) },
    netInvestingCashFlow: { type: FieldActualOnlySchema, default: () => ({}) },
    cashAtEndOfMonth: { type: FieldActualOnlySchema, default: () => ({}) },
    
    // Receivables & Inventory (Actual only)
    accountsReceivable: { type: FieldActualOnlySchema, default: () => ({}) },
    daysReceivableOutstanding: { type: FieldActualOnlySchema, default: () => ({}) },
    overdueAccountsReceivable: { type: FieldActualOnlySchema, default: () => ({}) },
    inventory: { type: FieldActualOnlySchema, default: () => ({}) },
    daysInventoryOutstanding: { type: FieldActualOnlySchema, default: () => ({}) },
    
    // Calculated Fields
    grossProfit: { type: FieldWithTypesSchema, default: () => ({}) },
    operatingProfit: { type: FieldWithTypesSchema, default: () => ({}) },
    netProfitBeforeTax: { type: FieldWithTypesSchema, default: () => ({}) },
    netProfitMargin: { type: FieldWithTypesSchema, default: () => ({}) },
    salesGrowth: { actual: { type: MonthlyDataSchema, default: () => ({}) } },
    totalSalesByProduct: { 
      actual: { type: MonthlyDataSchema, default: () => ({}) },
      target: { type: MonthlyDataSchema, default: () => ({}) }
    },
    totalHeadcount: { type: FieldActualOnlySchema, default: () => ({}) },
    overdueReceivablePercentage: { type: FieldActualOnlySchema, default: () => ({}) }
  }, { _id: false });

// CFO Dashboard Schema
// models/InvestorDashboardData.js - UPDATE CFO Dashboard Schema

const CFODashboardSchema = new mongoose.Schema({
  // P&L Data - Change to nested structure like CEO Dashboard
  revenue: { type: FieldWithTypesSchema, default: () => ({}) },
  costOfGoodsSold: { type: FieldWithTypesSchema, default: () => ({}) },
  operatingExpenses: { type: FieldWithTypesSchema, default: () => ({}) },
  otherIncome: { type: FieldWithTypesSchema, default: () => ({}) },
  financeExpense: { type: FieldWithTypesSchema, default: () => ({}) },
  
  // Cash Flow Data - Change to actual-only nested structure
  netOperatingCashFlow: { type: FieldActualOnlySchema, default: () => ({}) },
  netFinancingCashFlow: { type: FieldActualOnlySchema, default: () => ({}) },
  netInvestingCashFlow: { type: FieldActualOnlySchema, default: () => ({}) },
  cashAtEndOfMonth: { type: FieldActualOnlySchema, default: () => ({}) },
  
  // Balance Sheet - Assets - Change to actual-only nested structure
  fixedAssets: { type: FieldActualOnlySchema, default: () => ({}) },
  currentAssets: { type: FieldActualOnlySchema, default: () => ({}) },
  otherAssets: { type: FieldActualOnlySchema, default: () => ({}) },
  
  // Balance Sheet - Liabilities - Change to actual-only nested structure
  currentLiabilities: { type: FieldActualOnlySchema, default: () => ({}) },
  longTermLiabilities: { type: FieldActualOnlySchema, default: () => ({}) },
  equity: { type: FieldActualOnlySchema, default: () => ({}) },
  
  // Working Capital - Change to actual-only nested structure
  accountsReceivable: { type: FieldActualOnlySchema, default: () => ({}) },
  daysReceivableOutstanding: { type: FieldActualOnlySchema, default: () => ({}) },
  overdueAccountsReceivable: { type: FieldActualOnlySchema, default: () => ({}) },
  accountsPayable: { type: FieldActualOnlySchema, default: () => ({}) },
  daysPayableOutstanding: { type: FieldActualOnlySchema, default: () => ({}) },
  inventory: { type: FieldActualOnlySchema, default: () => ({}) },
  daysInventoryOutstanding: { type: FieldActualOnlySchema, default: () => ({}) },
  
  // Calculated Fields - Keep nested structure for calculated fields
  grossProfit: { type: FieldWithTypesSchema, default: () => ({}) },
  operatingProfit: { type: FieldWithTypesSchema, default: () => ({}) },
  netProfitBeforeTax: { type: FieldWithTypesSchema, default: () => ({}) },
  netProfitMargin: { type: FieldWithTypesSchema, default: () => ({}) },
  totalAssets: { type: FieldActualOnlySchema, default: () => ({}) },
  totalLiabilitiesAndEquity: { type: FieldActualOnlySchema, default: () => ({}) },
  currentRatio: { type: FieldActualOnlySchema, default: () => ({}) },
  quickRatio: { type: FieldActualOnlySchema, default: () => ({}) },
  debtEquityRatio: { type: FieldActualOnlySchema, default: () => ({}) },
  overdueReceivablePercentage: { type: FieldActualOnlySchema, default: () => ({}) }
}, { _id: false });


// Audit schema
const AuditEntrySchema = new mongoose.Schema({
  actorType: { type: String, enum: ['investor','admin'], required: true },
  actorId: { type: String },
  action: { type: String, required: true },
  dashboardType: { type: String, enum: ['CEO', 'CFO'] },
  meta: { type: Object, default: {} },
  at: { type: Date, default: Date.now }
}, { _id: false });

// Main Investor Dashboard Data Schema
const InvestorDashboardDataSchema = new mongoose.Schema({
  investorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Investor', required: true, unique: true },
  
  investorProfile: { type: InvestorProfileSchema, default: () => ({}) },
  // Dashboard data
  ceoDashboard: { type: CEODashboardSchema, default: () => ({}) },
  cfoDashboard: { type: CFODashboardSchema, default: () => ({}) },
  
  // Metadata
  lastUpdated: { type: Date, default: Date.now },
  completionPercentage: {
    ceo: { type: Number, default: 0 },
    cfo: { type: Number, default: 0 },
    overall: { type: Number, default: 0 }
  },
  isComplete: {
    ceo: { type: Boolean, default: false },
    cfo: { type: Boolean, default: false },
    overall: { type: Boolean, default: false }
  },
  audit: [AuditEntrySchema]
  
}, { timestamps: true });

InvestorDashboardDataSchema.index({ investorId: 1 }, { unique: true });
InvestorDashboardDataSchema.index({ lastUpdated: -1 });

export default mongoose.model('InvestorDashboardData', InvestorDashboardDataSchema);
