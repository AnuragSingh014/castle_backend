// controllers/dashboardController.js
import DashboardData from '../models/DashboardData.js';
import User from '../models/User.js';
import Admin from '../models/Admin.js';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

const COMPONENTS = ['information','overview','informationSheet','beneficialOwnerCertification','companyReferences','ddform','loanDetails','ceoDashboard','cfoDashboard','loanRequest']; // ✅ ADDED loanRequest
const FREE = new Set(['information','overview']);

async function ensureApprovalFields(doc) {
  const approvals = doc.approvals || {};
  
  // ✅ Use 'approved' instead of 'open' to match frontend
  if (!approvals.information) approvals.information = 'approved';
  if (!approvals.overview) approvals.overview = 'approved';
  if (!approvals.informationSheet) approvals.informationSheet = 'approved';
  if (!approvals.beneficialOwnerCertification) approvals.beneficialOwnerCertification = 'locked';
  if (!approvals.companyReferences) approvals.companyReferences = 'locked';
  if (!approvals.ddform) approvals.ddform = 'locked';
  if (!approvals.loanDetails) approvals.loanDetails = 'locked';
  if (!approvals.ceoDashboard) approvals.ceoDashboard = 'locked';
  if (!approvals.cfoDashboard) approvals.cfoDashboard = 'locked';
  // ✅ NEW: Add loanRequest approval field
  if (!approvals.loanRequest) approvals.loanRequest = 'locked';
  
  doc.approvals = approvals;
  return doc;
}

// ✅ UPDATED getOrCreateDashboard function with loanRequest approval
async function getOrCreateDashboard(userId) {
  let doc = await DashboardData.findOne({ userId });
  if (!doc) {
    doc = await DashboardData.create({ 
      userId,
      approvals: {
        information: 'approved',
        overview: 'approved',
        informationSheet: 'approved',
        beneficialOwnerCertification: 'locked',
        companyReferences: 'locked',
        ddform: 'locked',
        loanDetails: 'locked',
        ceoDashboard: 'locked',
        cfoDashboard: 'locked',
        loanRequest: 'open'// ✅ NEW: Default to open
      }
    });
  } else {
    // Ensure all approval fields exist for existing documents
    doc = await ensureApprovalFields(doc);
    await doc.save();
  }
  return doc;
}

// ✅ NEW: Middleware to check loan request access
export async function checkLoanRequestAccess(req, res, next) {
  try {
    const { userId } = req.params;
    const doc = await DashboardData.findOne({ userId });
    
    if (!doc) {
      return res.status(404).json({ 
        success: false, 
        error: 'dashboard_not_found' 
      });
    }
    
    // Check if loan request section is approved
    const approvalStatus = doc.approvals?.loanRequest || 'locked';
    if (approvalStatus !== 'approved' && approvalStatus !== 'open') {
      return res.status(403).json({ 
        success: false,
        error: 'access_denied', 
        message: 'Loan request section requires admin approval to access' 
      });
    }
    
    next();
  } catch (error) {
    console.error('Loan request access check error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'internal_server_error' 
    });
  }
}

function calculateCompletionPercentage(d) {
  let done = 0;
  for (const c of COMPONENTS) {
    const data = d[c];
    const filled = data && (
      (typeof data === 'string' && data.trim() !== '') ||
      (Array.isArray(data) && data.length > 0) ||
      (typeof data === 'object' && Object.values(data).some(v =>
        v !== null && v !== '' && (typeof v !== 'object' || (v && Object.keys(v).length > 0))
      ))
    );
    if (filled) done++;
  }
  return Math.round((done / COMPONENTS.length) * 100);
}

// ✅ FIXED getDashboardData - uses getOrCreateDashboard to avoid 404
export const getDashboardData = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // ✅ Use getOrCreateDashboard instead of just findOne
    const dashboardData = await getOrCreateDashboard(userId);
    
    const response = {
      success: true,
      data: {
        ...dashboardData.toObject(),
        // ✅ Ensure approvals are included
        approvals: dashboardData.approvals
      }
    };

    console.log('Sending dashboard data with approvals:', response.data.approvals);
    res.json(response);
  } catch (error) {
    console.error('Dashboard GET error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard data'
    });
  }
};

export async function getCompletionStatus(req, res) {
  try {
    const { userId } = req.params;
    const doc = await getOrCreateDashboard(userId);
    const parts = COMPONENTS.map(component => ({
      component,
      isComplete: !!doc[component] && Object.keys(doc[component] || {}).length > 0,
      lastUpdated: doc.updatedAt
    }));
    return res.json({
      success: true,
      data: {
        overallCompletion: doc.completionPercentage,
        isComplete: doc.isComplete,
        lastUpdated: doc.lastUpdated,
        components: parts
      }
    });
  } catch (e) {
    return res.status(500).json({ error: 'internal_error', details: e.message });
  }
}

export async function saveComponentData(req, res) {
  try {
    const { userId, component } = req.params;
    const payload = req.body;

    console.log(`Saving component: ${component} for user: ${userId}`);

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const doc = await getOrCreateDashboard(userId);

    // ✅ SAFETY CHECK - Ensure audit array exists
    if (!doc.audit) {
      doc.audit = [];
      console.log('Initialized audit array');
    }

    doc[component] = payload;
    doc.lastUpdated = new Date();
    doc.completionPercentage = calculateCompletionPercentage(doc);
    doc.isComplete = doc.completionPercentage === 100;

    // ✅ SAFE AUDIT PUSH
    try {
      doc.audit.push({
        actorType: 'user',
        actorId: String(userId),
        action: `update_${component}`,
        meta: { size: Array.isArray(payload) ? payload.length : Object.keys(payload || {}).length }
      });
      console.log('Audit entry added successfully');
    } catch (auditError) {
      console.warn('Audit push failed:', auditError);
      // Continue without audit - don't fail the whole save
    }

    console.log('About to save document...');
    await doc.save();
    console.log('Document saved successfully');

    // live stream (if socket server injected)
    if (req.app.get('io')) {
      req.app.get('io').to(`user:${userId}`).emit('dashboard:update', { component, data: doc[component] });
      req.app.get('io').to('admin').emit('admin:dashboardUpdate', { userId, component });
    }

    return res.json({ 
      success: true, 
      message: `${component} saved successfully`, 
      completionPercentage: doc.completionPercentage, 
      isComplete: doc.isComplete 
    });
  } catch (e) {
    console.error('SaveComponentData error:', e);
    console.error('Error stack:', e.stack);
    return res.status(500).json({ error: 'internal_error', details: e.message });
  }
}

// Convenience aliases using the generic save method
export const saveInformationData = (req, res) => { req.params.component = 'information'; return saveComponentData(req, res); };
export const saveOverviewData = (req, res) => { req.params.component = 'overview'; return saveComponentData(req, res); };
export const saveInformationSheetData = (req, res) => { req.params.component = 'informationSheet'; return saveComponentData(req, res); };
export const saveBeneficialOwnerData = (req, res) => { req.params.component = 'beneficialOwnerCertification'; return saveComponentData(req, res); };
export const saveCompanyReferencesData = (req, res) => { req.params.component = 'companyReferences'; return saveComponentData(req, res); };
export const saveLoanDetailsData = (req, res) => { req.params.component = 'loanDetails'; return saveComponentData(req, res); };

// Add this new function in controllers/dashboardController.js
export const saveDDFormData = async (req, res) => {
  try {
    const { userId } = req.params;
    const payload = req.body;

    console.log('Raw DD Form payload received');

    // ✅ Transform financial data to numbers
    if (payload.financialInformation) {
      payload.financialInformation = {
        annualRevenue: parseFloat(payload.financialInformation.annualRevenue) || 0,
        profitMargin: parseFloat(payload.financialInformation.profitMargin) || 0,
        debtRatio: parseFloat(payload.financialInformation.debtRatio) || 0,
        cashFlow: parseFloat(payload.financialInformation.cashFlow) || 0
      };
    }

    // ✅ Transform documents structure
    if (payload.documents && Array.isArray(payload.documents)) {
      payload.documents = payload.documents.map(docObj => ({
        type: docObj.type || '',
        filename: docObj.fileName || '',
        originalName: docObj.fileName || '',
        mimetype: 'application/pdf',
        size: 0,
        path: docObj.fileLink || '', // ✅ FIXED - Use docObj instead of doc
        uploadedAt: new Date()
      }));
    }

    console.log('DD Form data transformed successfully');

    // Use the existing saveComponentData logic
    req.params.component = 'ddform';
    return saveComponentData(req, res);
  } catch (e) {
    console.error('DD Form save error:', e);
    return res.status(500).json({ error: 'internal_error', details: e.message });
  }
};

export async function deleteDashboardData(req, res) {
  try {
    const { userId } = req.params;
    const removed = await DashboardData.findOneAndDelete({ userId });
    if (!removed) return res.status(404).json({ error: 'not_found' });
    return res.json({ success: true, message: 'dashboard_deleted' });
  } catch (e) {
    return res.status(500).json({ error: 'internal_error', details: e.message });
  }
}

export async function uploadPDF(req, res) {
  try {
    const { userId } = req.params;
    const { title, description } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    const fileBuffer = req.file.buffer;
    const base64Data = fileBuffer.toString('base64');

    const doc = await getOrCreateDashboard(userId);

    // Replace existing PDF (not append)
    doc.pdfDocument = {
      title: title || req.file.originalname,
      description: description || '',
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      data: base64Data,
      uploadedAt: new Date()
    };

    await doc.save();

    return res.json({
      success: true,
      message: 'PDF uploaded successfully'
    });
  } catch (error) {
    console.error('PDF upload error:', error);
    return res.status(500).json({ error: 'internal_error', details: error.message });
  }
}

// Get user's PDF info
export async function getUserPDF(req, res) {
  try {
    const { userId } = req.params;
    const doc = await DashboardData.findOne({ userId });
    
    if (!doc || !doc.pdfDocument) {
      return res.json({ success: true, document: null });
    }

    return res.json({
      success: true,
      document: {
        title: doc.pdfDocument.title,
        description: doc.pdfDocument.description,
        originalName: doc.pdfDocument.originalName,
        size: doc.pdfDocument.size,
        uploadedAt: doc.pdfDocument.uploadedAt
      }
    });
  } catch (error) {
    return res.status(500).json({ error: 'internal_error', details: error.message });
  }
}

// Download user's PDF
export async function downloadUserPDF(req, res) {
  try {
    const { userId } = req.params;
    const doc = await DashboardData.findOne({ userId });
    
    if (!doc || !doc.pdfDocument) {
      return res.status(404).json({ error: 'No PDF found' });
    }

    const buffer = Buffer.from(doc.pdfDocument.data, 'base64');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${doc.pdfDocument.originalName}"`);
    
    return res.send(buffer);
  } catch (error) {
    return res.status(500).json({ error: 'internal_error', details: error.message });
  }
}

export async function uploadCompanySignature(req, res) {
  try {
    const { userId } = req.params;
    const { founderName, founderTitle } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No signature file uploaded' });
    }
    
    if (!founderName || !founderTitle) {
      return res.status(400).json({ error: 'Founder name and title are required' });
    }

    const fileBuffer = req.file.buffer;
    const base64Data = fileBuffer.toString('base64');

    const doc = await getOrCreateDashboard(userId);
    
    doc.companySignature = {
      data: base64Data,
      founderName: founderName.trim(),
      founderTitle: founderTitle.trim(),
      filename: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      uploadedAt: new Date() // Store current date when signature is uploaded
    };

    await doc.save();

    return res.json({
      success: true,
      message: 'Company signature uploaded successfully'
    });

  } catch (error) {
    console.error('Company signature upload error:', error);
    return res.status(500).json({ error: 'internal_error', details: error.message });
  }
}

// Add this new function to get all data needed for e-mandate
export async function getEmandateInfo(req, res) {
  try {
    const { userId } = req.params;
    
    // Get dashboard data with company info and user signature
    const dashboard = await DashboardData.findOne({ userId }).populate('userId', 'name email');
    if (!dashboard) {
      return res.status(404).json({ error: 'Dashboard not found' });
    }

    if (!dashboard.companySignature) {
      return res.status(404).json({ error: 'Company signature not found' });
    }

    // Get admin signature
    const admin = await Admin.findOne({}).limit(1);
    if (!admin || !admin.signature) {
      return res.status(404).json({ error: 'Admin signature not found' });
    }

    // Return all data needed for e-mandate PDF
    return res.json({
      success: true,
      data: {
        // Company info
        companyName: dashboard.information?.companyName || 'Company Name',
        companyAddress: dashboard.information?.contactInfo?.address || 'Company Address',
        
        // User signature info (with the date they uploaded)
        founderName: dashboard.companySignature.founderName,
        founderTitle: dashboard.companySignature.founderTitle,
        userSignature: dashboard.companySignature.data,
        signatureUploadDate: dashboard.companySignature.uploadedAt,
        
        // Admin signature
        adminSignature: admin.signature.data
      }
    });

  } catch (error) {
    console.error('Get emandate info error:', error);
    return res.status(500).json({ error: 'internal_error', details: error.message });
  }
}

// Get company signature
export async function getCompanySignature(req, res) {
  try {
    const { userId } = req.params;
    const doc = await DashboardData.findOne({ userId });
    
    if (!doc || !doc.companySignature) {
      return res.json({ success: true, signature: null });
    }

    return res.json({
      success: true,
      signature: {
        filename: doc.companySignature.filename,
        mimetype: doc.companySignature.mimetype,
        size: doc.companySignature.size,
        uploadedAt: doc.companySignature.uploadedAt,
        data: doc.companySignature.data
      }
    });
  } catch (error) {
    return res.status(500).json({ error: 'internal_error', details: error.message });
  }
}

// Generate emandate PDF
export async function generateEmandate(req, res) {
  try {
    const { userId } = req.params;
    
    const dashboard = await DashboardData.findOne({ userId }).populate('userId', 'name email');
    if (!dashboard) {
      return res.status(404).json({ error: 'Dashboard not found' });
    }

    if (!dashboard.companySignature) {
      return res.status(404).json({ error: 'Company signature not found' });
    }

    // Get admin signature
    const admin = await Admin.findOne({}).limit(1); // Get first admin
    if (!admin || !admin.signature) {
      return res.status(404).json({ error: 'Admin signature not found' });
    }

    const pdfBytes = await generateEmandatePDF(dashboard, admin);
    
    return res.json({
      success: true,
      message: 'E-mandate generated successfully',
      pdfData: Buffer.from(pdfBytes).toString('base64')
    });

  } catch (error) {
    console.error('Generate emandate error:', error);
    return res.status(500).json({ error: 'internal_error', details: error.message });
  }
}

// Download emandate
export async function downloadEmandate(req, res) {
  try {
    const { userId } = req.params;
    
    const dashboard = await DashboardData.findOne({ userId }).populate('userId', 'name email');
    if (!dashboard || !dashboard.companySignature) {
      return res.status(404).json({ error: 'Signature not found' });
    }

    const admin = await Admin.findOne({}).limit(1);
    if (!admin || !admin.signature) {
      return res.status(404).json({ error: 'Admin signature not found' });
    }

    const pdfBytes = await generateEmandatePDF(dashboard, admin);
    
    // ✅ Safe filename generation
    const safeName = dashboard.userId && dashboard.userId.name 
      ? dashboard.userId.name.replace(/\s+/g, '_') 
      : 'company';
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="emandate_${safeName}.pdf"`);
    return res.send(pdfBytes);

  } catch (error) {
    console.error('Download emandate error:', error); // ✅ Log the full error
    return res.status(500).json({ error: 'internal_error', details: error.message });
  }
}

// ✅ UPDATED: Enhanced saveLoanRequest function with validation and gating check
export async function saveLoanRequest(req, res) {
  try {
    const { userId } = req.params;
    const { loanAmountRequired, expectedROI, tenure, tenureUnit, loanType, loanPurpose } = req.body;
    
    // Validate required fields
    if (!loanAmountRequired || loanAmountRequired <= 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'loan_amount_required',
        message: 'Loan amount is required and must be greater than 0'
      });
    }
    
    if (!expectedROI || expectedROI <= 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'expected_roi_required',
        message: 'Expected ROI is required and must be greater than 0'
      });
    }
    
    if (!tenure || tenure <= 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'tenure_required',
        message: 'Tenure is required and must be greater than 0'
      });
    }

    const doc = await DashboardData.findOne({ userId });
    if (!doc) {
      return res.status(404).json({ 
        success: false, 
        error: 'dashboard_not_found' 
      });
    }
    
    // Update loan request data
    doc.loanRequest = {
      loanAmountRequired: parseFloat(loanAmountRequired),
      expectedROI: parseFloat(expectedROI),
      tenure: parseInt(tenure),
      tenureUnit: tenureUnit || 'months',
      loanType: loanType || '',
      loanPurpose: loanPurpose || '',
      submittedAt: new Date(),
      status: 'submitted'
    };
    
    // Add audit entry
    doc.audit.push({
      actorType: 'user',
      actorId: userId,
      action: 'save_loan_request',
      meta: { 
        loanAmountRequired: parseFloat(loanAmountRequired), 
        expectedROI: parseFloat(expectedROI), 
        tenure: parseInt(tenure),
        loanType,
        loanPurpose
      }
    });
    
    await doc.save();
    
    return res.status(200).json({ 
      success: true, 
      loanRequest: doc.loanRequest,
      message: 'Loan request saved successfully'
    });

  } catch (error) {
    console.error('Error saving loan request:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'internal_server_error',
      message: error.message 
    });
  }
}

// ✅ UPDATED: Enhanced getLoanRequest function  
export async function getLoanRequest(req, res) {
  try {
    const { userId } = req.params;
    
    // Validate userId
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        error: 'user_id_required' 
      });
    }

    const doc = await DashboardData.findOne({ userId });
    if (!doc) {
      return res.status(404).json({ 
        success: false, 
        error: 'dashboard_not_found' 
      });
    }

    // Return loan request data (will be null/empty if not submitted yet)
    return res.status(200).json({
      success: true,
      loanRequest: doc.loanRequest || {
        loanAmountRequired: 0,
        expectedROI: 0,
        tenure: 0,
        tenureUnit: 'months',
        loanType: '',
        loanPurpose: '',
        submittedAt: null,
        status: 'draft'
      }
    });

  } catch (error) {
    console.error('Error fetching loan request:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'internal_server_error',
      message: error.message 
    });
  }
}

// PDF generation helper function
async function generateEmandatePDF(dashboard, admin) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4 size
  
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Add title
  page.drawText('E-MANDATE AUTHORIZATION', {
    x: 50,
    y: 800,
    size: 20,
    font: boldFont,
    color: rgb(0, 0, 0),
  });

  // Add company info
  page.drawText(`Company: ${dashboard.information?.companyName || 'N/A'}`, {
    x: 50,
    y: 750,
    size: 12,
    font: font,
  });

  page.drawText(`User: ${dashboard.userId.name}`, {
    x: 50,
    y: 730,
    size: 12,
    font: font,
  });

  page.drawText(`Email: ${dashboard.userId.email}`, {
    x: 50,
    y: 710,
    size: 12,
    font: font,
  });

  // Add mandate content
  page.drawText('I hereby authorize the processing of financial data and', {
    x: 50,
    y: 650,
    size: 12,
    font: font,
  });

  page.drawText('related services as per the terms and conditions.', {
    x: 50,
    y: 630,
    size: 12,
    font: font,
  });

  // Add signatures
  page.drawText('Company Signature:', {
    x: 50,
    y: 200,
    size: 12,
    font: boldFont,
  });

  page.drawText('Admin Signature:', {
    x: 300,
    y: 200,
    size: 12,
    font: boldFont,
  });

  // Embed signature images
  try {
    if (dashboard.companySignature?.data) {
      const companySignatureImage = await pdfDoc.embedPng(Buffer.from(dashboard.companySignature.data, 'base64'));
      page.drawImage(companySignatureImage, {
        x: 50,
        y: 120,
        width: 150,
        height: 60,
      });
    }

    if (admin.signature?.data) {
      const adminSignatureImage = await pdfDoc.embedPng(Buffer.from(admin.signature.data, 'base64'));
      page.drawImage(adminSignatureImage, {
        x: 300,
        y: 120,
        width: 150,
        height: 60,
      });
    }
  } catch (imageError) {
    console.log('Image embedding error:', imageError);
    // Continue without images if there's an error
  }

  // Add date
  page.drawText(`Date: ${new Date().toLocaleDateString()}`, {
    x: 50,
    y: 80,
    size: 12,
    font: font,
  });

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}
