// middleware/sectionGate.js
import DashboardData from '../models/DashboardData.js';

const FREE_SECTIONS = new Set(['information','overview']);

export async function ensureSectionWritable(req, res, next) {
  const { userId } = req.params;
  
  if (!userId) {
    return res.status(400).json({ error: 'missing_user_id' });
  }

  // ✅ FIXED - Determine component from route path
  let component;
  
  // Extract component name from the route URL
  if (req.originalUrl.includes('/ddform')) {
    component = 'ddform';
  } else if (req.originalUrl.includes('/beneficial-owner')) {
    component = 'beneficialOwnerCertification';
  } else if (req.originalUrl.includes('/company-references')) {
    component = 'companyReferences';
  } else if (req.originalUrl.includes('/loan-details')) {
    component = 'loanDetails';
  } else if (req.originalUrl.includes('/informationSheet')) {
    component = 'informationSheet';
  } else {
    // Fallback for generic /component/:component route
    component = req.params.component;
  }

  if (!component) {
    return res.status(400).json({ error: 'cannot_determine_component' });
  }

  console.log(`Checking section gate for component: ${component}`);

  if (FREE_SECTIONS.has(component)) {
    console.log(`Component ${component} is free, allowing access`);
    return next();
  }

  try {
    const doc = await DashboardData.findOne({ userId });
    if (!doc) {
      console.log('No dashboard found for user, creating one...');
      return res.status(404).json({ error: 'dashboard_not_found' });
    }

    const state = doc.approvals?.[component] || 'locked';
    console.log(`Component ${component} approval state: ${state}`);
    
    if (state !== 'approved') {
      return res.status(403).json({ 
        error: 'section_locked', 
        message: `${component} is ${state}. Admin approval required.` 
      });
    }

    console.log(`Component ${component} is approved, allowing access`);
    return next();
  } catch (error) {
    console.error('Section gate error:', error);
    return res.status(500).json({ error: 'internal_error', details: error.message });
  }
}
