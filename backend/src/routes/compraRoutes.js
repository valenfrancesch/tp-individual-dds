import { Router } from 'express';
import * as compraController from '../controllers/compraController.js';
import * as mensajeController from '../controllers/mensajeController.js';
import * as reseniaController from '../controllers/reseniaController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/compras', requireAuth, compraController.crear);
router.get('/compras/mias', requireAuth, compraController.mias);
router.get('/compras/:id', requireAuth, compraController.obtener);
router.post('/compras/:id/pagar', requireAuth, compraController.pagar);
router.post('/compras/:id/cancelar', requireAuth, compraController.cancelar);
router.post('/compras/:id/utilizar', requireAuth, compraController.utilizar);
router.get('/compras/:id/mensajes', requireAuth, mensajeController.listar);
router.post('/compras/:id/mensajes', requireAuth, mensajeController.enviar);
router.post('/compras/:id/resenia', requireAuth, reseniaController.crear);
router.get('/organizadores/me/resenias', requireAuth, reseniaController.mias);
router.get(
  '/organizadores/:id/resenias',
  requireAuth,
  reseniaController.porOrganizador,
);

export default router;
