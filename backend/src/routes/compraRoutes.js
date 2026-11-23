import { Router } from 'express';
import * as compraController from '../controllers/compraController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { Roles } from '../domain/Roles.js';

const router = Router();

router.use('/compras', requireAuth);

router.post('/compras', requireRole(Roles.COMPRADOR), compraController.crear);
router.get('/compras/mias', compraController.mias);
router.get('/compras/:id', compraController.obtener);
router.post('/compras/:id/pagar', compraController.comando('pagar'));
router.post('/compras/:id/cancelar', compraController.comando('cancelar'));
router.post('/compras/:id/utilizar', compraController.comando('utilizar'));
router.post('/compras/:id/reembolsar', compraController.comando('marcarReembolsada'));
router.get('/compras/:id/mensajes', compraController.listarMensajes);
router.post('/compras/:id/mensajes', compraController.enviarMensaje);
router.post('/compras/:id/resenia', compraController.reseniar);

export default router;
