import { Router } from 'express';
import { adminLogin, adminProfile, adminLogout } from '../controllers/adminAuthController.js';
import { adminAuthMiddleware } from '../middleware/adminAuthMiddleware.js';
import { listUsers, getUserDetails, setSectionApproval, setWebsiteDisplayStatus,   getPublishedCompanies,  getAllUserPDFs,    adminDownloadPDF, setPublicAmount } from '../controllers/adminController.js';

const router = Router();

// Public admin routes (no auth required)
router.post('/login', adminLogin);

// Protected admin routes (require authentication)
router.use(adminAuthMiddleware);

router.get('/profile', adminProfile);
router.post('/logout', adminLogout);
router.get('/users', listUsers);
router.get('/users/:userId', getUserDetails);
router.post('/users/:userId/approve', setSectionApproval);
router.post('/users/:userId/website-display', setWebsiteDisplayStatus); 
router.get('/published-companies', getPublishedCompanies); 

// ADD: Admin PDF routes
router.get('/pdfs', getAllUserPDFs);
router.get('/users/:userId/pdf/download', adminDownloadPDF);

// Add this line to routes/adminRoutes.js after your existing routes:
router.post('/users/:userId/public-amount', setPublicAmount);


export default router;
