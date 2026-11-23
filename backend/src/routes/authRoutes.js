import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Iniciar sesión = crear una sesión (devuelve el JWT).
router.post('/sesiones', authController.login);
router.get('/usuarios/demo', authController.seedUsers);
router.get('/usuarios/me', requireAuth, authController.me);

export default router;
