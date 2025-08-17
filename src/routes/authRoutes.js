// routes/authRoutes.js
import { Router } from 'express';
import { signup, login, getUser } from '../controllers/authController.js';

const router = Router();
router.post('/signup', signup);
router.post('/login', login);
router.get('/users/:id', getUser);

export default router;
