// controllers/investorAdminController.js
import Investor from '../models/Investor.js';
import InvestorDashboardData from '../models/InvestorDashboardData.js';

export async function getInvestorDetails(req, res) {
    try {
      const { investorId } = req.params;
      
      const investor = await Investor.findById(investorId, {
        email: 1,
        name: 1,
        password: 1,
        signupData: 1,
        createdAt: 1
      });
  
      if (!investor) return res.status(404).json({ error: 'investor_not_found' });
  
      const dashboardData = await InvestorDashboardData.findOne({ investorId }); // ← FIXED
  
      return res.json({ investor, dashboardData }); // ← FIXED
    } catch (error) {
      return res.status(500).json({ error: 'internal_server_error' });
    }
  }
  

  
export async function listInvestors(req, res) {
  try {
    const investors = await Investor.find({ isActive: true }, {
      email: 1,
      name: 1,
      password: 1, // plain password for your viewing
      createdAt: 1
    }).sort({ createdAt: -1 });

    return res.json({ investors });
  } catch (error) {
    return res.status(500).json({ error: 'internal_server_error' });
  }
}

// Add to investorAdminController.js
export async function getInvestorInvestments(req, res) {
  try {
    const { investorId } = req.params;
    
    const dashboardData = await InvestorDashboardData.findOne({ investorId });
    if (!dashboardData) {
      return res.status(404).json({ error: 'Investor dashboard not found' });
    }

    // Deserialize additional details
    const investments = dashboardData.investmentPortfolio.map(investment => {
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
        totalInvestments: investments.length 
      }
    });
  } catch (error) {
    console.error('GetInvestorInvestments error:', error);
    return res.status(500).json({ error: 'internal_server_error' });
  }
}
