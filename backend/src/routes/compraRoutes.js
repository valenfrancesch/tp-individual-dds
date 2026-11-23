import { Router } from 'express';
import * as compraController from '../controllers/compraController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { Roles } from '../domain/Roles.js';

const router = Router();

router.use('/compras', requireAuth);

router.post('/compras', requireRole(Roles.COMPRADOR), compraController.crear);
router.get('/usuarios/me/compras', requireAuth, compraController.mias);
router.get('/compras/:id', compraController.obtener);
// Pagar, cancelar, utilizar y reembolsar = registrar un cambio de estado { estado }.
router.post('/compras/:id/cambios-estado', compraController.cambiarEstado);
router.get('/compras/:id/mensajes', compraController.listarMensajes);
router.post('/compras/:id/mensajes', compraController.enviarMensaje);
router.post('/compras/:id/resenia', compraController.reseniar);

export default router;
