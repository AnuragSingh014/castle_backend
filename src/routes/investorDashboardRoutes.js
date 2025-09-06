// routes/investorDashboardRoutes.js
import { Router } from 'express';
import {
  getDashboardData,
  saveCEODashboardData,
  saveCFODashboardData,
  getCalculatedMetrics,
  deleteDashboardData,
  saveInvestorProfile,
  getInvestmentPortfolio,
  addInvestment,
  updateInvestment,
  deleteInvestment
} from '../controllers/investorDashboardController.js';

const router = Router();

router.post('/:investorId/investor-profile', saveInvestorProfile);
router.get('/:investorId', getDashboardData);
router.post('/:investorId/ceo-dashboard', saveCEODashboardData);
router.post('/:investorId/cfo-dashboard', saveCFODashboardData);
router.get('/:investorId/calculated-metrics/:dashboardType', getCalculatedMetrics);
router.delete('/:investorId', deleteDashboardData);
// Add to routes/investorDashboardRoutes.js

// Add these routes after your existing routes
router.get('/:investorId/investments', getInvestmentPortfolio);
router.post('/:investorId/investments', addInvestment);
router.put('/:investorId/investments/:investmentId', updateInvestment);
router.delete('/:investorId/investments/:investmentId', deleteInvestment);

export default router;
