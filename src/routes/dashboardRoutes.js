// routes/dashboardRoutes.js
import { Router } from 'express';
import multer from 'multer';
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
  deleteDashboardData,
  uploadPDF,      // ADD this import
  getUserPDF,     // ADD this import
  downloadUserPDF,
  uploadCompanySignature,
  getCompanySignature,
  generateEmandate,
  downloadEmandate,
  getEmandateInfo
} from '../controllers/dashboardController.js';
import { ensureSectionWritable } from '../middleware/sectionGate.js';

const router = Router();

// ADD THIS SECTION AFTER YOUR EXISTING IMPORTS
// Configure multer for image uploads (signatures)
const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files allowed'), false);
    }
  }
});

router.get('/:userId/emandate-info', getEmandateInfo);

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


// ADD: Configure multer for PDF uploads
const pdfUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files allowed'), false);
    }
  }
});

// ... your existing routes ...

// ADD: PDF routes
router.post('/:userId/upload-pdf', pdfUpload.single('pdfFile'), uploadPDF);
router.get('/:userId/pdf', getUserPDF);
router.get('/:userId/pdf/download', downloadUserPDF);

// Add these routes after your existing ones
router.post('/:userId/upload-signature', imageUpload.single('signature'), uploadCompanySignature);
router.get('/:userId/signature', getCompanySignature);
router.get('/:userId/emandate/generate', generateEmandate);
router.get('/:userId/emandate/download', downloadEmandate);

export default router;
