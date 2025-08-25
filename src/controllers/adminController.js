import User from '../models/User.js';
import DashboardData from '../models/DashboardData.js';
import { syncToPublishedCompanies } from './publicController.js';

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

// Add this new function for website display approval


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

// controllers/adminController.js - ADD these functions

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
