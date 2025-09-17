import { Router } from 'express';
import { adminLogin, adminProfile, adminLogout } from '../controllers/adminAuthController.js';
import { adminAuthMiddleware } from '../middleware/adminAuthMiddleware.js';
import { 
  listUsers, 
  getUserDetails, 
  setSectionApproval, 
  setWebsiteDisplayStatus,   
  getPublishedCompanies,  
  getAllUserPDFs,    
  adminDownloadPDF, 
  setPublicAmount,
  uploadAdminSignature, 
  getAdminSignature, 
  downloadUserEmandate,
  replaceCompanyPresentation,
  // ✅ NEW: Import separate CEO/CFO approval functions
  setCompanyCeoDashboardApproval,
  setCompanyCfoDashboardApproval,
  setInvestorSectionApproval,
  // ✅ NEW: Import loan request approval function
  setLoanRequestApproval
} from '../controllers/adminController.js';
import multer from 'multer';
import { listInvestors, getInvestorDetails, getInvestorInvestments } from '../controllers/investorAdminController.js';

const router = Router();

// Public admin routes (no auth required)
router.post('/login', adminLogin);

// Protected admin routes (require authentication)
router.use(adminAuthMiddleware);

router.get('/profile', adminProfile);
router.post('/logout', adminLogout);
router.get('/users', listUsers);
router.get('/users/:userId', getUserDetails);

// ✅ EXISTING: General section approval (for informationSheet, loanDetails, etc.)
router.post('/users/:userId/approve', setSectionApproval);

// ✅ NEW: Separate routes for company CEO/CFO dashboard approvals
router.post('/users/:userId/approve-ceo-dashboard', setCompanyCeoDashboardApproval);
router.post('/users/:userId/approve-cfo-dashboard', setCompanyCfoDashboardApproval);

// ✅ NEW: Loan request approval route
router.post('/users/:userId/approve-loan-request', setLoanRequestApproval);

// ✅ NEW: Separate routes for investor CEO/CFO dashboard approvals
router.post('/investors/:investorId/approve-ceo-dashboard', setInvestorSectionApproval);
router.post('/investors/:investorId/approve-cfo-dashboard', setInvestorSectionApproval);

router.post('/users/:userId/website-display', setWebsiteDisplayStatus); 
router.get('/published-companies', getPublishedCompanies); 

// ADD: Admin PDF routes
router.get('/pdfs', getAllUserPDFs);
router.get('/users/:userId/pdf/download', adminDownloadPDF);

// Add this line to routes/adminRoutes.js after your existing routes:
router.post('/users/:userId/public-amount', setPublicAmount);

// Add these routes after existing routes
router.get('/investors', listInvestors);
router.get('/investors/:investorId', getInvestorDetails);
// Add to adminRoutes.js
router.get('/investors/:investorId/investments', getInvestorInvestments);


// Configure multer for image uploads
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

// Add these routes after your existing ones
router.post('/upload-signature', imageUpload.single('signature'), uploadAdminSignature);
router.get('/signature', getAdminSignature);
router.get('/users/:userId/emandate/download', downloadUserEmandate);
// Add this route to your adminRoutes.js
router.get('/investors/:investorId/investments', getInvestorInvestments);

export default router;
