import { Router } from 'express';
import * as eventoController from '../controllers/eventoController.js';
import * as compraController from '../controllers/compraController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { Roles } from '../domain/Roles.js';

const router = Router();
const organizador = requireRole(Roles.ORGANIZADOR);

router.use(requireAuth);

router.get('/categorias', eventoController.listarCategorias);
router.get('/eventos', eventoController.listarEventos);
router.get('/eventos/mios', organizador, eventoController.misEventos);
router.get('/eventos/:id', eventoController.obtenerEvento);
router.post('/eventos', organizador, eventoController.crearEvento);
router.get('/eventos/:id/compras', organizador, compraController.porEvento);

router.get('/usuarios/me/favoritos', eventoController.listarFavoritos);
router.post('/usuarios/me/favoritos/:eventoId', eventoController.agregarFavorito);
router.delete('/usuarios/me/favoritos/:eventoId', eventoController.quitarFavorito);

router.get('/organizadores/me/resenias', organizador, eventoController.misResenias);

export default router;
