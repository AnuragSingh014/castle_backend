// routes/publicRoutes.js
import { Router } from 'express';
import { 
  getAllPublishedCompanies, 
  getPublishedCompanyById, 
  getIndustries 
} from '../controllers/publicController.js';

const router = Router();

// Public routes - no authentication required
router.get('/companies', getAllPublishedCompanies);
router.get('/companies/:companyId', getPublishedCompanyById);
router.get('/industries', getIndustries);

export default router;
