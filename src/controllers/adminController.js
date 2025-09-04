import User from '../models/User.js';
import DashboardData from '../models/DashboardData.js';
import InvestorDashboardData from '../models/InvestorDashboardData.js';
import { syncToPublishedCompanies } from './publicController.js';
import Admin from '../models/Admin.js';

export async function setWebsiteDisplayStatus(req, res) {
  try {
    const { userId } = req.params;
    const { displayOnWebsite } = req.body;
    
    const doc = await DashboardData.findOne({ userId });
    if (!doc) {
      return res.status(404).json({ error: 'dashboard_not_found' });
    }
    
    // Set website display status
    doc.isDisplayedOnWebsite = displayOnWebsite;
    doc.audit.push({ 
      actorType: 'admin', 
      actorId: req.admin.username, 
      action: 'set_website_display', 
      meta: { displayOnWebsite } 
    });
    
    await doc.save();

    // ✅ NEW: Sync to published companies table
    await syncToPublishedCompanies(userId, displayOnWebsite);
    
    return res.json({ 
      success: true, 
      message: `Website display ${displayOnWebsite ? 'enabled' : 'disabled'}`,
      isDisplayedOnWebsite: doc.isDisplayedOnWebsite 
    });
  } catch (error) {
    console.error('Website display error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'internal_server_error',
      message: error.message 
    });
  }
}

export async function listUsers(req, res) {
  try {
    const users = await User.find({}, { 
      email: 1, 
      name: 1, 
      password: 1, // plain password for your viewing
      createdAt: 1 
    }).sort({ createdAt: -1 });
    
    return res.json({ users });
  } catch (error) {
    return res.status(500).json({ error: 'internal_server_error' });
  }
}

export async function getUserDetails(req, res) {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId, { 
      email: 1, 
      name: 1, 
      password: 1, // plain password for your viewing
      signupData: 1, 
      createdAt: 1 
    });
    
    if (!user) return res.status(404).json({ error: 'user_not_found' });

    const dashboard = await DashboardData.findOne({ userId });
    return res.json({ user, dashboard });
  } catch (error) {
    return res.status(500).json({ error: 'internal_server_error' });
  }
}

// Add route to get published companies for website
export async function getPublishedCompanies(req, res) {
  try {
    const publishedCompanies = await DashboardData.find({ 
      isDisplayedOnWebsite: true,
      isComplete: true 
    })
    .populate('userId', 'name email')
    .select('information overview financialHighlights createdAt updatedAt')
    .sort({ updatedAt: -1 });
    
    return res.json({ 
      success: true,
      companies: publishedCompanies 
    });
  } catch (error) {
    console.error('Get published companies error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'internal_server_error' 
    });
  }
}

export async function setSectionApproval(req, res) {
  try {
    console.log('=== setSectionApproval called ===');
    console.log('userId:', req.params.userId);
    console.log('body:', req.body);
    console.log('admin:', req.admin);
    
    const { userId } = req.params;
    const { component, state } = req.body;
    
    if (!['locked','approved','open'].includes(state)) {
      console.log('Invalid state:', state);
      return res.status(400).json({ error: 'invalid_state' });
    }

    const doc = await DashboardData.findOne({ userId });
    console.log('Found document:', doc ? 'Yes' : 'No');
    
    if (!doc) return res.status(404).json({ error: 'dashboard_not_found' });

    // Never lock Information/Overview to keep UX consistent
    if (component === 'information' || component === 'overview') {
      console.log('Cannot modify free sections:', component);
      return res.status(400).json({ error: 'cannot_lock_free_sections' });
    }

    console.log('Before update - approvals:', doc.approvals);
    
    doc.approvals[component] = state;
    doc.audit.push({ 
      actorType: 'admin', 
      actorId: req.admin.username, 
      action: 'set_approval', 
      meta: { component, state } 
    });
    
    await doc.save();
    
    console.log('After update - approvals:', doc.approvals);

    if (req.app.get('io')) {
      req.app.get('io').to(`user:${userId}`).emit('approval:update', { component, state });
    }

    console.log('Sending success response');
    return res.status(200).json({ 
      success: true, 
      ok: true, 
      approvals: doc.approvals,
      message: `${component} set to ${state}` 
    });
  } catch (error) {
    console.error('setSectionApproval error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'internal_server_error',
      message: error.message 
    });
  }
}

// ✅ NEW: Separate function for company CEO dashboard approval
export async function setCompanyCeoDashboardApproval(req, res) {
  try {
    console.log('=== setCompanyCeoDashboardApproval called ===');
    console.log('userId:', req.params.userId);
    console.log('body:', req.body);
    
    const { userId } = req.params;
    const { state } = req.body; // 'approved' or 'locked'

    if (!['locked','approved','open'].includes(state)) {
      return res.status(400).json({ error: 'invalid_state' });
    }

    const doc = await DashboardData.findOne({ userId });
    if (!doc) return res.status(404).json({ error: 'dashboard_not_found' });

    doc.approvals.ceoDashboard = state;
    doc.audit.push({
      actorType: 'admin',
      actorId: req.admin.username,
      action: 'set_ceo_dashboard_approval',
      meta: { state }
    });

    await doc.save();

    if (req.app.get('io')) {
      req.app.get('io').to(`user:${userId}`).emit('approval:update', { 
        component: 'ceoDashboard', 
        state 
      });
    }

    return res.status(200).json({
      success: true,
      approvals: doc.approvals,
      message: `CEO Dashboard ${state}`
    });
  } catch (error) {
    console.error('setCompanyCeoDashboardApproval error:', error);
    return res.status(500).json({
      success: false,
      error: 'internal_server_error',
      message: error.message
    });
  }
}

// ✅ NEW: Separate function for company CFO dashboard approval
export async function setCompanyCfoDashboardApproval(req, res) {
  try {
    console.log('=== setCompanyCfoDashboardApproval called ===');
    console.log('userId:', req.params.userId);
    console.log('body:', req.body);
    
    const { userId } = req.params;
    const { state } = req.body; // 'approved' or 'locked'

    if (!['locked','approved','open'].includes(state)) {
      return res.status(400).json({ error: 'invalid_state' });
    }

    const doc = await DashboardData.findOne({ userId });
    if (!doc) return res.status(404).json({ error: 'dashboard_not_found' });

    doc.approvals.cfoDashboard = state;
    doc.audit.push({
      actorType: 'admin',
      actorId: req.admin.username,
      action: 'set_cfo_dashboard_approval',
      meta: { state }
    });

    await doc.save();

    if (req.app.get('io')) {
      req.app.get('io').to(`user:${userId}`).emit('approval:update', { 
        component: 'cfoDashboard', 
        state 
      });
    }

    return res.status(200).json({
      success: true,
      approvals: doc.approvals,
      message: `CFO Dashboard ${state}`
    });
  } catch (error) {
    console.error('setCompanyCfoDashboardApproval error:', error);
    return res.status(500).json({
      success: false,
      error: 'internal_server_error',
      message: error.message
    });
  }
}

// ✅ NEW: Set approval for investor CEO/CFO dashboard
export async function setInvestorSectionApproval(req, res) {
  try {
    console.log('=== setInvestorSectionApproval called ===');
    console.log('investorId:', req.params.investorId);
    console.log('body:', req.body);
    
    const { investorId } = req.params;
    const { state } = req.body;
    
    // Determine component from route path
    const component = req.route.path.includes('ceo') ? 'ceoDashboard' : 'cfoDashboard';

    if (!['locked','approved','open'].includes(state)) {
      return res.status(400).json({ error: 'invalid_state' });
    }

    let doc = await InvestorDashboardData.findOne({ investorId });
    if (!doc) {
      doc = new InvestorDashboardData({ investorId });
    }

    if (!doc.approvals) {
      doc.approvals = {};
    }

    doc.approvals[component] = state;
    doc.audit.push({
      actorType: 'admin',
      actorId: req.admin.username,
      action: `set_investor_${component}_approval`,
      meta: { state }
    });

    await doc.save();

    return res.status(200).json({
      success: true,
      approvals: doc.approvals,
      message: `Investor ${component} ${state}`
    });
  } catch (error) {
    console.error('setInvestorSectionApproval error:', error);
    return res.status(500).json({
      success: false,
      error: 'internal_server_error',
      message: error.message
    });
  }
}

// ✅ NEW: Function to toggle loan request approval
export async function setLoanRequestApproval(req, res) {
  try {
    console.log('=== setLoanRequestApproval called ===');
    console.log('userId:', req.params.userId);
    console.log('body:', req.body);
    
    const { userId } = req.params;
    const { state } = req.body; // 'approved' or 'locked'

    if (!['locked','approved','open'].includes(state)) {
      return res.status(400).json({ error: 'invalid_state' });
    }

    const doc = await DashboardData.findOne({ userId });
    if (!doc) return res.status(404).json({ error: 'dashboard_not_found' });

    doc.approvals.loanRequest = state;
    doc.audit.push({
      actorType: 'admin',
      actorId: req.admin.username,
      action: 'set_loan_request_approval',
      meta: { state }
    });

    await doc.save();

    if (req.app.get('io')) {
      req.app.get('io').to(`user:${userId}`).emit('approval:update', { 
        component: 'loanRequest', 
        state 
      });
    }

    return res.status(200).json({
      success: true,
      approvals: doc.approvals,
      message: `Loan Request ${state}`
    });
  } catch (error) {
    console.error('setLoanRequestApproval error:', error);
    return res.status(500).json({
      success: false,
      error: 'internal_server_error',
      message: error.message
    });
  }
}

// Admin get all user PDFs
export async function getAllUserPDFs(req, res) {
  try {
    const dashboards = await DashboardData.find({ 'pdfDocument': { $exists: true } })
      .populate('userId', 'name email')
      .select('userId pdfDocument');

    const userPDFs = dashboards.map(dashboard => ({
      userId: dashboard.userId._id,
      userName: dashboard.userId.name,
      userEmail: dashboard.userId.email,
      title: dashboard.pdfDocument.title,
      originalName: dashboard.pdfDocument.originalName,
      size: dashboard.pdfDocument.size,
      uploadedAt: dashboard.pdfDocument.uploadedAt
    }));

    return res.json({ success: true, pdfs: userPDFs });
  } catch (error) {
    return res.status(500).json({ error: 'internal_error', details: error.message });
  }
}

// Admin download any user's PDF
export async function adminDownloadPDF(req, res) {
  try {
    const { userId } = req.params;
    const doc = await DashboardData.findOne({ userId });
    
    if (!doc || !doc.pdfDocument) {
      return res.status(404).json({ error: 'No PDF found for this user' });
    }

    const buffer = Buffer.from(doc.pdfDocument.data, 'base64');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${doc.pdfDocument.originalName}"`);
    
    return res.send(buffer);
  } catch (error) {
    return res.status(500).json({ error: 'internal_error', details: error.message });
  }
}

// Add this function to controllers/adminController.js
export async function setPublicAmount(req, res) {
  try {
    const { userId } = req.params;
    const { amount } = req.body;

    const doc = await DashboardData.findOne({ userId });
    if (!doc) {
      return res.status(404).json({ error: 'dashboard_not_found' });
    }

    doc.publicAmount = parseFloat(amount) || 0;
    await doc.save();

    return res.json({
      success: true,
      message: 'Amount updated successfully',
      publicAmount: doc.publicAmount
    });
  } catch (error) {
    return res.status(500).json({ error: 'internal_server_error' });
  }
}

// Admin signature upload
export async function uploadAdminSignature(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No signature file uploaded' });
    }

    const fileBuffer = req.file.buffer;
    const base64Data = fileBuffer.toString('base64');

    // Update admin signature (assuming single admin)
    const admin = await Admin.findOne({ username: req.admin.username });
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    admin.signature = {
      data: base64Data,
      filename: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      uploadedAt: new Date()
    };

    await admin.save();

    return res.json({
      success: true,
      message: 'Admin signature uploaded successfully'
    });
  } catch (error) {
    console.error('Admin signature upload error:', error);
    return res.status(500).json({ error: 'internal_error', details: error.message });
  }
}

// Get admin signature
export async function getAdminSignature(req, res) {
  try {
    const admin = await Admin.findOne({ username: req.admin.username });
    if (!admin || !admin.signature) {
      return res.json({ success: true, signature: null });
    }

    return res.json({
      success: true,
      signature: {
        filename: admin.signature.filename,
        mimetype: admin.signature.mimetype,
        size: admin.signature.size,
        uploadedAt: admin.signature.uploadedAt,
        data: admin.signature.data
      }
    });
  } catch (error) {
    return res.status(500).json({ error: 'internal_error', details: error.message });
  }
}

// Admin download user emandate
export async function downloadUserEmandate(req, res) {
  try {
    const { userId } = req.params;
    
    // Get user dashboard data
    const dashboard = await DashboardData.findOne({ userId }).populate('userId', 'name email');
    if (!dashboard) {
      return res.status(404).json({ error: 'Dashboard not found' });
    }

    if (!dashboard.companySignature) {
      return res.status(404).json({ error: 'Company signature not found' });
    }

    // Get admin signature
    const admin = await Admin.findOne({ username: req.admin.username });
    if (!admin || !admin.signature) {
      return res.status(404).json({ error: 'Admin signature not found' });
    }

    // Generate PDF with both signatures
    const pdfBytes = await generateEmandatePDF(dashboard, admin);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="emandate_${dashboard.userId.name.replace(/\s+/g, '_')}.pdf"`);
    return res.send(pdfBytes);

  } catch (error) {
    console.error('Admin download emandate error:', error);
    return res.status(500).json({ error: 'internal_error', details: error.message });
  }
}
