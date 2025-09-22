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
  uploadPDF,      
  getUserPDF,     
  downloadUserPDF,
  uploadCompanySignature,
  getCompanySignature,
  generateEmandate,
  downloadEmandate,
  getEmandateInfo, 
  saveLoanRequest, 
  getLoanRequest,
  checkLoanRequestAccess  // ✅ NEW: Import the middleware
} from '../controllers/dashboardController.js';
import { ensureSectionWritable } from '../middleware/sectionGate.js';

const router = Router();

// Configure multer for image uploads (signatures)
const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 5MB limit
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

// ✅ NEW: Loan Request routes with gating middleware applied
router.post('/:userId/loan-request',  saveLoanRequest);
router.get('/:userId/loan-request',  getLoanRequest);

// Generic endpoint (applies gate if not free)
router.post('/:userId/component/:component', async (req, res, next) => {
  req.params.componentGateChecked = true;
  next();
}, ensureSectionWritable, saveComponentData);

router.delete('/:userId', deleteDashboardData);

// Configure multer for PDF uploads
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

// PDF routes
router.post('/:userId/upload-pdf', pdfUpload.single('pdfFile'), uploadPDF);
router.get('/:userId/pdf', getUserPDF);
router.get('/:userId/pdf/download', downloadUserPDF);

// Signature and e-mandate routes
router.post('/:userId/upload-signature', imageUpload.single('signature'), uploadCompanySignature);
router.get('/:userId/signature', getCompanySignature);
router.get('/:userId/emandate/generate', generateEmandate);
router.get('/:userId/emandate/download', downloadEmandate);

export default router;
