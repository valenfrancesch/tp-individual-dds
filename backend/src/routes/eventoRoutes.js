import { Router } from 'express';
import * as eventoController from '../controllers/eventoController.js';
import * as compraController from '../controllers/compraController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/categorias', requireAuth, eventoController.listarCategorias);
router.get('/eventos', requireAuth, eventoController.listarEventos);
router.get('/eventos/mios', requireAuth, eventoController.misEventos);
router.get('/eventos/:id', requireAuth, eventoController.obtenerEvento);
router.post('/eventos', requireAuth, eventoController.crearEvento);
router.get('/eventos/:id/compras', requireAuth, compraController.porEvento);
router.post(
  '/usuarios/me/favoritos/:eventoId',
  requireAuth,
  eventoController.toggleFavorito,
);
router.delete(
  '/usuarios/me/favoritos/:eventoId',
  requireAuth,
  eventoController.toggleFavorito,
);

export default router;
