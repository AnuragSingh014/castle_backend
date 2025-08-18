// routes/publicRoutes.js
import { Router } from 'express';
import { 
  getAllPublishedCompanies, 
  getPublishedCompanyById, 
  getIndustries,
  getPublicPDFs,    
  downloadPublicPDF,
  debugUserPDFs
} from '../controllers/publicController.js';

const router = Router();

// Public routes - no authentication required
router.get('/companies', getAllPublishedCompanies);
router.get('/companies/:companyId', getPublishedCompanyById);
router.get('/industries', getIndustries);
router.get('/pdfs', getPublicPDFs);
router.get('/pdfs/:userId/download', downloadPublicPDF);

// routes/publicRoutes.js - ADD this temporary route
router.get('/debug-pdfs', debugUserPDFs);

export default router;
