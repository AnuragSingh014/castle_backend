// routes/dashboardRoutes.js
import { Router } from 'express';
import {
  getDashboardData,
  getCompletionStatus,
  saveComponentData,
  saveInformationData,
  saveOverviewData,
  saveInformationSheetData,
  saveBeneficialOwnerData,
  saveCompanyReferencesData,
  saveDDFormData,
  saveLoanDetailsData,
  deleteDashboardData
} from '../controllers/dashboardController.js';
import { ensureSectionWritable } from '../middleware/sectionGate.js';

const router = Router();

router.get('/:userId', getDashboardData);
router.get('/:userId/completion-status', getCompletionStatus);

// Free sections (no gate)
router.post('/:userId/information', saveInformationData);
router.post('/:userId/overview', saveOverviewData);

// Gated sections
router.post('/:userId/informationSheet', ensureSectionWritable, saveInformationSheetData);
router.post('/:userId/beneficial-owner', ensureSectionWritable, saveBeneficialOwnerData);
router.post('/:userId/company-references', ensureSectionWritable, saveCompanyReferencesData);
router.post('/:userId/ddform', ensureSectionWritable, saveDDFormData);
router.post('/:userId/loan-details', ensureSectionWritable, saveLoanDetailsData);

// Generic endpoint (applies gate if not free)
router.post('/:userId/component/:component', async (req, res, next) => {
  req.params.componentGateChecked = true;
  next();
}, ensureSectionWritable, saveComponentData);

router.delete('/:userId', deleteDashboardData);

export default router;
