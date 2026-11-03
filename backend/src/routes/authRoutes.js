import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/seed-users', authController.seedUsers);
router.post('/login', authController.login);
router.get('/me', requireAuth, authController.me);

export default router;
