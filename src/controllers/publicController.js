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
      .select('-originalDashboardId') // Hide internal IDs
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
      .select('-originalDashboardId');
    
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
   
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch company details'
    });
  }
}

// Sync published data (called when admin toggles display)
// controllers/publicController.js - REPLACE syncToPublishedCompanies function
// controllers/publicController.js - REPLACE with this debug version
export async function syncToPublishedCompanies(userId, isDisplayed) {
  try {
    console.log('🔄 SYNC DEBUG: Starting sync for userId:', userId, 'isDisplayed:', isDisplayed);
    
    if (isDisplayed) {
      // Add/Update in published companies table
      const dashboardData = await DashboardData.findOne({ userId })
        .populate('userId', 'name email');
      
      console.log('🔄 SYNC DEBUG: Dashboard data found:', !!dashboardData);
      console.log('🔄 SYNC DEBUG: Company name:', dashboardData?.information?.companyName);
      
      if (!dashboardData) {
        throw new Error('Dashboard data not found');
      }

      // Prepare data for published table
      const publishedData = {
        originalUserId: userId,
        originalDashboardId: dashboardData._id,
        isActive: true,
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

      console.log('🔄 SYNC DEBUG: Published data prepared, originalUserId:', publishedData.originalUserId);

      // Try to find by originalUserId first
      let existingCompany = await PublishedCompany.findOne({ originalUserId: userId });
      console.log('🔄 SYNC DEBUG: Found by originalUserId:', !!existingCompany);
      
      if (!existingCompany) {
        // Fallback: find by company name
        const companyName = dashboardData.information?.companyName;
        console.log('🔄 SYNC DEBUG: Searching by company name:', companyName);
        
        if (companyName) {
          existingCompany = await PublishedCompany.findOne({ 
            'companyInfo.companyName': companyName 
          });
          console.log('🔄 SYNC DEBUG: Found by company name:', !!existingCompany);
          if (existingCompany) {
            console.log('🔄 SYNC DEBUG: Existing company ID:', existingCompany._id);
          }
        }
      }

      if (existingCompany) {
        // Update existing record
        console.log('🔄 SYNC DEBUG: Updating existing company:', existingCompany._id);
        const result = await PublishedCompany.findByIdAndUpdate(
          existingCompany._id,
          publishedData,
          { new: true }
        );
        console.log('🔄 SYNC DEBUG: Update result originalUserId:', result?.originalUserId);
      } else {
        // Create new record
        console.log('🔄 SYNC DEBUG: Creating new company record');
        const result = await PublishedCompany.create(publishedData);
        console.log('🔄 SYNC DEBUG: Created new record with originalUserId:', result?.originalUserId);
      }

      console.log('✅ SYNC DEBUG: Sync completed successfully');
    } else {
      console.log('🔄 SYNC DEBUG: Disabling company display');
      // ... existing disable logic
    }
  } catch (error) {
    console.error('🚨 SYNC DEBUG: Error in sync function:', error);
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

// controllers/publicController.js - ADD these functions

// Public get all PDFs from published companies
export async function getPublicPDFs(req, res) {
  try {
    const dashboards = await DashboardData.find({ 
      isDisplayedOnWebsite: true,
      'pdfDocument': { $exists: true }
    })
    .populate('userId', 'name email')
    .select('userId pdfDocument information');

    const publicPDFs = dashboards.map(dashboard => ({
      userId: dashboard.userId._id,
      companyName: dashboard.information?.companyName || dashboard.userId.name,
      title: dashboard.pdfDocument.title,
      description: dashboard.pdfDocument.description,
      originalName: dashboard.pdfDocument.originalName,
      size: dashboard.pdfDocument.size,
      uploadedAt: dashboard.pdfDocument.uploadedAt
    }));

    return res.json({ success: true, pdfs: publicPDFs });
  } catch (error) {
    return res.status(500).json({ error: 'internal_error', details: error.message });
  }
}

// Public download PDF
// controllers/publicController.js - REPLACE downloadPublicPDF with this debug version
export async function downloadPublicPDF(req, res) {
  try {
    const { userId } = req.params;
    console.log('🔍 DEBUG: PDF download requested for userId:', userId);
    
    // Step 1: Check if user exists at all
    const userExists = await DashboardData.findOne({ userId: userId });
    console.log('👤 DEBUG: User exists in database:', !!userExists);
    
    if (!userExists) {
      console.log('❌ DEBUG: User not found in database');
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Step 2: Check if user has pdfDocument field
    console.log('📄 DEBUG: User has pdfDocument:', !!userExists.pdfDocument);
    
    if (userExists.pdfDocument) {
      console.log('📄 DEBUG: PDF details:', {
        title: userExists.pdfDocument.title,
        originalName: userExists.pdfDocument.originalName,
        hasData: !!userExists.pdfDocument.data,
        dataLength: userExists.pdfDocument.data ? userExists.pdfDocument.data.length : 0
      });
    }
    
    // Step 3: Run the actual query
    const dashboard = await DashboardData.findOne({
      userId: userId,
      'pdfDocument': { $exists: true }
    });
    
    console.log('✅ DEBUG: Query result found:', !!dashboard);

    if (!dashboard || !dashboard.pdfDocument) {
      console.log('❌ DEBUG: No dashboard found or no PDF document');
      return res.status(404).json({ error: 'PDF not found' });
    }

    console.log('📦 DEBUG: About to send PDF, data length:', dashboard.pdfDocument.data.length);

    const buffer = Buffer.from(dashboard.pdfDocument.data, 'base64');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${dashboard.pdfDocument.originalName}"`);
    
    return res.send(buffer);
  } catch (error) {
    
    return res.status(500).json({ error: 'internal_error', details: error.message });
  }
}

// controllers/publicController.js - ADD this temporary debug function
export async function debugUserPDFs(req, res) {
  try {
    const usersWithPDFs = await DashboardData.find({ 
      'pdfDocument': { $exists: true } 
    })
    .select('userId information.companyName pdfDocument.originalName')
    .limit(10);

 

    return res.json({
      success: true,
      usersWithPDFs: usersWithPDFs.map(user => ({
        userId: user.userId,
        companyName: user.information?.companyName || 'No name',
        pdfName: user.pdfDocument?.originalName || 'No PDF name'
      }))
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
