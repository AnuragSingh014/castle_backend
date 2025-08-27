// routes/investorAuthRoutes.js
import { Router } from 'express';
import { investorSignup, investorLogin, getInvestor } from '../controllers/investorAuthController.js';

const router = Router();

router.post('/signup', investorSignup);
router.post('/login', investorLogin);
router.get('/investors/:id', getInvestor);

export default router;
