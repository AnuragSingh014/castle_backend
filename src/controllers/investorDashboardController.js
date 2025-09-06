// controllers/investorDashboardController.js
import InvestorDashboardData from '../models/InvestorDashboardData.js';
import Investor from '../models/Investor.js';

// Get or create dashboard data
async function getOrCreateDashboardData(investorId) {
  let doc = await InvestorDashboardData.findOne({ investorId });
  if (!doc) {
    doc = await InvestorDashboardData.create({ investorId });
  }
  return doc;
}

// Calculate completion percentage
// controllers/investorDashboardController.js

function calculateCompletionPercentage(data, requiredFields) {
  const months = ['apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec', 'jan', 'feb', 'mar'];
  let totalFields = requiredFields.length * months.length;
  let completedFields = 0;

  requiredFields.forEach(field => {
    months.forEach(month => {
      // Handle nested structure: field.actual[month]
      if (data[field]?.actual?.[month] && data[field].actual[month] !== 0) {
        completedFields++;
      }
      // Fallback for flat structure: field[month]  
      else if (data[field]?.[month] && data[field][month] !== 0) {
        completedFields++;
      }
    });
  });

  return Math.round((completedFields / totalFields) * 100);
}


export const getDashboardData = async (req, res) => {
  try {
    const { investorId } = req.params;
    const dashboardData = await getOrCreateDashboardData(investorId);
    
    res.json({
      success: true,
      data: dashboardData.toObject()
    });
  } catch (error) {
    console.error('Dashboard GET error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard data'
    });
  }
};



// controllers/investorDashboardController.js

export async function saveCFODashboardData(req, res) {
  try {
    const { investorId } = req.params;
    const cfoData = req.body; // This already contains calculated fields from frontend

    const investor = await Investor.findById(investorId);
    if (!investor) return res.status(404).json({ error: 'Investor not found' });

    const doc = await getOrCreateDashboardData(investorId);

    // Just save the data directly - no backend calculations needed
    doc.cfoDashboard = { ...doc.cfoDashboard.toObject(), ...cfoData };
    doc.lastUpdated = new Date();

    // Update completion percentage based on required input fields only
    const requiredCFOFields = ['revenue', 'costOfGoodsSold', 'currentAssets', 'currentLiabilities'];
    doc.completionPercentage.cfo = calculateCompletionPercentage(doc.cfoDashboard, requiredCFOFields);
    doc.isComplete.cfo = doc.completionPercentage.cfo === 100;
    doc.completionPercentage.overall = Math.round((doc.completionPercentage.ceo + doc.completionPercentage.cfo) / 2);
    doc.isComplete.overall = doc.isComplete.ceo && doc.isComplete.cfo;

    // Add audit entry
    if (!doc.audit) doc.audit = [];
    doc.audit.push({
      actorType: 'investor',
      actorId: String(investorId),
      action: 'update_cfo_dashboard',
      dashboardType: 'CFO',
      meta: { fieldsUpdated: Object.keys(cfoData) }
    });

    await doc.save();

    return res.json({
      success: true,
      message: 'CFO Dashboard data saved successfully',
      data: {
        cfoDashboard: doc.cfoDashboard,
        completionPercentage: doc.completionPercentage
      }
    });
  } catch (e) {
    console.error('SaveCFODashboardData error:', e);
    return res.status(500).json({ error: 'internal_error', details: e.message });
  }
}

export async function saveCEODashboardData(req, res) {
  try {
    const { investorId } = req.params;
    const ceoData = req.body; // This already contains calculated fields from frontend

    const investor = await Investor.findById(investorId);
    if (!investor) return res.status(404).json({ error: 'Investor not found' });

    const doc = await getOrCreateDashboardData(investorId);

    // Just save the data directly - no backend calculations needed
    doc.ceoDashboard = { ...doc.ceoDashboard.toObject(), ...ceoData };
    doc.lastUpdated = new Date();

    // Update completion percentage based on required input fields only
    const requiredCEOFields = ['revenue', 'costOfGoodsSold', 'operatingExpenses'];
    doc.completionPercentage.ceo = calculateCompletionPercentage(doc.ceoDashboard, requiredCEOFields);
    doc.isComplete.ceo = doc.completionPercentage.ceo === 100;
    doc.completionPercentage.overall = Math.round((doc.completionPercentage.ceo + doc.completionPercentage.cfo) / 2);
    doc.isComplete.overall = doc.isComplete.ceo && doc.isComplete.cfo;

    // Add audit entry
    if (!doc.audit) doc.audit = [];
    doc.audit.push({
      actorType: 'investor',
      actorId: String(investorId),
      action: 'update_ceo_dashboard',
      dashboardType: 'CEO',
      meta: { fieldsUpdated: Object.keys(ceoData) }
    });

    await doc.save();

    return res.json({
      success: true,
      message: 'CEO Dashboard data saved successfully',
      data: {
        ceoDashboard: doc.ceoDashboard,
        completionPercentage: doc.completionPercentage
      }
    });
  } catch (e) {
    console.error('SaveCEODashboardData error:', e);
    return res.status(500).json({ error: 'internal_error', details: e.message });
  }
}

export async function getCalculatedMetrics(req, res) {
  try {
    const { investorId, dashboardType } = req.params;
    const doc = await InvestorDashboardData.findOne({ investorId });

    if (!doc) {
      return res.status(404).json({ error: 'Dashboard data not found' });
    }

    let calculatedMetrics;
    if (dashboardType === 'ceo') {
      calculatedMetrics = InvestorCalculationService.calculateCEOMetrics(doc.ceoDashboard);
    } else if (dashboardType === 'cfo') {
      calculatedMetrics = InvestorCalculationService.calculateCFOMetrics(doc.cfoDashboard);
    } else {
      return res.status(400).json({ error: 'Invalid dashboard type' });
    }

    return res.json({
      success: true,
      data: calculatedMetrics
    });
  } catch (e) {
    console.error('GetCalculatedMetrics error:', e);
    return res.status(500).json({ error: 'internal_error', details: e.message });
  }
}

export async function deleteDashboardData(req, res) {
  try {
    const { investorId } = req.params;
    const removed = await InvestorDashboardData.findOneAndDelete({ investorId });
    if (!removed) return res.status(404).json({ error: 'not_found' });
    return res.json({ success: true, message: 'dashboard_data_deleted' });
  } catch (e) {
    return res.status(500).json({ error: 'internal_error', details: e.message });
  }
}

// Add to controllers/investorDashboardController.js

// controllers/investorDashboardController.js
export async function saveInvestorProfile(req, res) {
    try {
      const { investorId } = req.params;
      const profileData = req.body;
      
      console.log('Saving profile for investor:', investorId);
      console.log('Profile data:', profileData);
  
      const investor = await Investor.findById(investorId);
      if (!investor) {
        return res.status(404).json({ success: false, error: 'Investor not found' });
      }
  
      const doc = await getOrCreateDashboardData(investorId);
  
      // Update investor profile
      doc.investorProfile = {
        name: profileData.name || '',
        email: profileData.email || '',
        phone: profileData.phone || ''
      };
      doc.lastUpdated = new Date();
  
      // Add audit entry
      if (!doc.audit) doc.audit = [];
      doc.audit.push({
        actorType: 'investor',
        actorId: String(investorId),
        action: 'update_investor_profile',
        meta: { fieldsUpdated: Object.keys(profileData) }
      });
  
      await doc.save();
  
      return res.json({
        success: true,
        message: 'Investor profile saved successfully',
        data: {
          investorProfile: doc.investorProfile
        }
      });
    } catch (e) {
      console.error('SaveInvestorProfile error:', e);
      return res.status(500).json({ 
        success: false, 
        error: 'internal_error', 
        details: e.message 
      });
    }
  }
  
  // Add these functions to your existing investorDashboardController.js

// Get investor's investment portfolio
// Replace the existing getInvestmentPortfolio function with this:
export async function getInvestmentPortfolio(req, res) {
  try {
    const { investorId } = req.params;
    
    const doc = await InvestorDashboardData.findOne({ investorId });
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Investor data not found' });
    }

    // ✅ FIX: Safely handle undefined investmentPortfolio
    const investmentPortfolio = doc.investmentPortfolio || [];

    // Deserialize additional details for each investment
    const investments = investmentPortfolio.map(investment => {
      const investmentObj = investment.toObject();
      try {
        investmentObj.additionalDetails = JSON.parse(investment.additionalDetails || '{}');
      } catch (e) {
        investmentObj.additionalDetails = {};
      }
      return investmentObj;
    });

    return res.json({
      success: true,
      data: {
        investments,
        summary: calculateInvestmentSummary(investments)
      }
    });
  } catch (error) {
    console.error('GetInvestmentPortfolio error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}


// Add new investment
export async function addInvestment(req, res) {
  try {
    const { investorId } = req.params;
    const investmentData = req.body;

    const doc = await getOrCreateDashboardData(investorId);

    // Serialize additional details
    const newInvestment = {
      ...investmentData,
      additionalDetails: JSON.stringify(investmentData.additionalDetails || {}),
      updatedAt: new Date()
    };

    doc.investmentPortfolio.push(newInvestment);
    doc.lastUpdated = new Date();

    // Add audit entry
    if (!doc.audit) doc.audit = [];
    doc.audit.push({
      actorType: 'investor',
      actorId: String(investorId),
      action: 'add_investment',
      meta: { companyName: investmentData.companyName }
    });

    await doc.save();

    return res.json({
      success: true,
      message: 'Investment added successfully',
      data: { investmentId: doc.investmentPortfolio[doc.investmentPortfolio.length - 1]._id }
    });
  } catch (error) {
    console.error('AddInvestment error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

// Update existing investment
export async function updateInvestment(req, res) {
  try {
    const { investorId, investmentId } = req.params;
    const updateData = req.body;

    const doc = await InvestorDashboardData.findOne({ investorId });
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Investor data not found' });
    }

    const investment = doc.investmentPortfolio.id(investmentId);
    if (!investment) {
      return res.status(404).json({ success: false, error: 'Investment not found' });
    }

    // Update fields
    Object.keys(updateData).forEach(key => {
      if (key === 'additionalDetails') {
        investment[key] = JSON.stringify(updateData[key] || {});
      } else {
        investment[key] = updateData[key];
      }
    });
    
    investment.updatedAt = new Date();
    doc.lastUpdated = new Date();

    // Add audit entry
    if (!doc.audit) doc.audit = [];
    doc.audit.push({
      actorType: 'investor',
      actorId: String(investorId),
      action: 'update_investment',
      meta: { investmentId, companyName: investment.companyName }
    });

    await doc.save();

    return res.json({
      success: true,
      message: 'Investment updated successfully'
    });
  } catch (error) {
    console.error('UpdateInvestment error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

// Delete investment
export async function deleteInvestment(req, res) {
  try {
    const { investorId, investmentId } = req.params;

    const doc = await InvestorDashboardData.findOne({ investorId });
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Investor data not found' });
    }

    const investment = doc.investmentPortfolio.id(investmentId);
    if (!investment) {
      return res.status(404).json({ success: false, error: 'Investment not found' });
    }

    const companyName = investment.companyName;
    doc.investmentPortfolio.pull(investmentId);
    doc.lastUpdated = new Date();

    // Add audit entry
    if (!doc.audit) doc.audit = [];
    doc.audit.push({
      actorType: 'investor',
      actorId: String(investorId),
      action: 'delete_investment',
      meta: { investmentId, companyName }
    });

    await doc.save();

    return res.json({
      success: true,
      message: 'Investment deleted successfully'
    });
  } catch (error) {
    console.error('DeleteInvestment error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

// Replace the existing calculateInvestmentSummary function:
function calculateInvestmentSummary(investments = []) {
  const summary = {
    totalInvestments: 0,
    totalAmountInvested: 0,
    totalCurrentValue: 0,
    activeInvestments: 0,
    exitedInvestments: 0,
    totalReturns: 0,
    averageStake: 0,
    topPerformers: [],
    investmentsByYear: {},
    investmentsByStatus: {}
  };

  // ✅ Safety check for undefined/null investments
  if (!Array.isArray(investments) || investments.length === 0) {
    return summary;
  }

  summary.totalInvestments = investments.length;

  investments.forEach(inv => {
    // Total amounts
    summary.totalAmountInvested += inv.amountInvested || 0;
    
    if (inv.currentStatus === 'Active') {
      const currentValue = inv.currentValuation && inv.stakePercentage 
        ? inv.currentValuation * (inv.stakePercentage / 100) 
        : inv.amountInvested;
      summary.totalCurrentValue += currentValue;
      summary.activeInvestments++;
    } else if (inv.currentStatus === 'Exited') {
      summary.totalReturns += (inv.exitAmount || 0) - (inv.amountInvested || 0);
      summary.exitedInvestments++;
    }

    // Group by year
    const year = inv.yearOfInvestment;
    if (year) {
      if (!summary.investmentsByYear[year]) {
        summary.investmentsByYear[year] = { count: 0, amount: 0 };
      }
      summary.investmentsByYear[year].count++;
      summary.investmentsByYear[year].amount += inv.amountInvested || 0;
    }

    // Group by status
    const status = inv.currentStatus;
    if (status) {
      if (!summary.investmentsByStatus[status]) {
        summary.investmentsByStatus[status] = 0;
      }
      summary.investmentsByStatus[status]++;
    }
  });

  // Calculate average stake
  const stakesSum = investments.reduce((sum, inv) => sum + (inv.stakePercentage || 0), 0);
  summary.averageStake = investments.length ? (stakesSum / investments.length).toFixed(2) : 0;

  // Calculate ROI
  summary.totalROI = summary.totalAmountInvested ? 
    (((summary.totalCurrentValue + summary.totalReturns - summary.totalAmountInvested) / summary.totalAmountInvested) * 100).toFixed(2) : 0;

  return summary;
}

