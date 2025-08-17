// controllers/publicController.js
import DashboardData from '../models/DashboardData.js';
import PublishedCompany from '../models/PublishedCompany.js';
import User from '../models/User.js';

// Get all published companies (public route - no auth needed)
export async function getAllPublishedCompanies(req, res) {
  try {
    const { page = 1, limit = 10, industry, search } = req.query;
    
    const query = { isActive: true };
    
    // Filter by industry if provided
    if (industry) {
      query['companyInfo.industry'] = industry;
    }
    
    // Search by company name if provided
    if (search) {
      query['companyInfo.companyName'] = { $regex: search, $options: 'i' };
    }

    const companies = await PublishedCompany.find(query)
      .select('-originalUserId -originalDashboardId') // Hide internal IDs
      .sort({ publishedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await PublishedCompany.countDocuments(query);

    return res.json({
      success: true,
      data: {
        companies,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalCompanies: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get published companies error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch published companies'
    });
  }
}

// Get single published company by ID
export async function getPublishedCompanyById(req, res) {
  try {
    const { companyId } = req.params;
    
    const company = await PublishedCompany.findById(companyId)
      .select('-originalUserId -originalDashboardId');
    
    if (!company || !company.isActive) {
      return res.status(404).json({
        success: false,
        error: 'Company not found'
      });
    }

    // Increment view count
    company.viewCount += 1;
    await company.save();

    return res.json({
      success: true,
      data: company
    });
  } catch (error) {
    console.error('Get company by ID error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch company details'
    });
  }
}

// Sync published data (called when admin toggles display)
export async function syncToPublishedCompanies(userId, isDisplayed) {
  try {
    if (isDisplayed) {
      // Add/Update in published companies table
      const dashboardData = await DashboardData.findOne({ userId })
        .populate('userId', 'name email');
      
      if (!dashboardData) {
        throw new Error('Dashboard data not found');
      }

      // Prepare data for published table
      const publishedData = {
        originalUserId: userId,
        originalDashboardId: dashboardData._id,
        companyInfo: {
          companyName: dashboardData.information?.companyName || '',
          companyType: dashboardData.information?.companyType || '',
          industry: dashboardData.information?.industry || '',
          foundedYear: dashboardData.information?.foundedYear || null,
          employeeCount: dashboardData.information?.employeeCount || null,
          headquarters: dashboardData.information?.headquarters || '',
          website: dashboardData.information?.website || '',
          description: dashboardData.information?.description || '',
          contactInfo: dashboardData.information?.contactInfo || {}
        },
        businessOverview: {
          businessModel: dashboardData.overview?.businessOverview || '',
          revenueStreams: dashboardData.overview?.revenueStreams || '',
          industryOverview: dashboardData.overview?.industryOverview || '',
          fundUtilization: dashboardData.overview?.fundUtilization || '',
          aboutPromoters: dashboardData.overview?.aboutPromoters || '',
          riskFactors: dashboardData.overview?.riskFactors || '',
          ipoIntermediaries: dashboardData.overview?.ipoIntermediaries || ''
        },
        financialHighlights: dashboardData.overview?.financialHighlights || {},
        peerAnalysis: dashboardData.overview?.peerAnalysis || {},
        shareholding: dashboardData.overview?.shareholding || {},
        images: dashboardData.overview?.images || [],
        informationSheet: dashboardData.informationSheet || {},
        beneficialOwners: dashboardData.beneficialOwnerCertification?.owners || [],
        companyReferences: dashboardData.companyReferences?.references || [],
        loanDetails: dashboardData.loanDetails?.loans || [],
        lastSyncedAt: new Date()
      };

      // Upsert (update if exists, create if not)
      await PublishedCompany.findOneAndUpdate(
        { originalUserId: userId },
        publishedData,
        { upsert: true, new: true }
      );

      console.log(`✅ Synced company data to published table for user: ${userId}`);
    } else {
      // Remove from published companies table
      await PublishedCompany.findOneAndUpdate(
        { originalUserId: userId },
        { isActive: false },
        { new: true }
      );
      
      console.log(`❌ Removed company from published table for user: ${userId}`);
    }
  } catch (error) {
    console.error('Sync to published companies error:', error);
    throw error;
  }
}

// Get industries list (for filtering)
export async function getIndustries(req, res) {
  try {
    const industries = await PublishedCompany.distinct('companyInfo.industry', { isActive: true });
    
    return res.json({
      success: true,
      data: industries.filter(industry => industry && industry.trim() !== '')
    });
  } catch (error) {
    console.error('Get industries error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch industries'
    });
  }
}
