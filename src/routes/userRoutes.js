import { Router } from 'express'
import { saveDashboardData } from '../controllers/userController.js'

const router = Router()

router.post('/:id/dashboard', saveDashboardData)

export default router

