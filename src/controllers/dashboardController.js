// controllers/dashboardController.js
import DashboardData from '../models/DashboardData.js';
import User from '../models/User.js';

const COMPONENTS = ['information','overview','informationSheet','beneficialOwnerCertification','companyReferences','ddform','loanDetails'];
const FREE = new Set(['information','overview']);

async function ensureApprovalFields(doc) {
  const approvals = doc.approvals || {};
  
  // ✅ Use 'approved' instead of 'open' to match frontend
  if (!approvals.information) approvals.information = 'approved';
  if (!approvals.overview) approvals.overview = 'approved';
  if (!approvals.informationSheet) approvals.informationSheet = 'locked';
  if (!approvals.beneficialOwnerCertification) approvals.beneficialOwnerCertification = 'locked';
  if (!approvals.companyReferences) approvals.companyReferences = 'locked';
  if (!approvals.ddform) approvals.ddform = 'locked';
  if (!approvals.loanDetails) approvals.loanDetails = 'locked';
  
  doc.approvals = approvals;
  return doc;
}

// ✅ SINGLE getOrCreateDashboard function with 'approved' values
async function getOrCreateDashboard(userId) {
  let doc = await DashboardData.findOne({ userId });
  if (!doc) {
    doc = await DashboardData.create({ 
      userId,
      approvals: {
        information: 'approved',        // ✅ Use 'approved' to match frontend
        overview: 'approved',           // ✅ Use 'approved' to match frontend
        informationSheet: 'locked',
        beneficialOwnerCertification: 'locked',
        companyReferences: 'locked',
        ddform: 'locked',
        loanDetails: 'locked'
      }
    });
  } else {
    // Ensure all approval fields exist for existing documents
    doc = await ensureApprovalFields(doc);
    await doc.save();
  }
  return doc;
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
