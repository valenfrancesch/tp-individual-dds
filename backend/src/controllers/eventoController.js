import * as eventoService from '../services/eventoService.js';

function handleError(res, error) {
  const status = error.status || 500;
  return res.status(status).json({ error: error.message || 'Error interno' });
}

export function listarCategorias(req, res) {
  try {
    return res.json(eventoService.listarCategorias());
  } catch (error) {
    return handleError(res, error);
  }
}

export function listarEventos(req, res) {
  try {
    const { q, categoriaId, orden, dir } = req.query;
    return res.json(
      eventoService.listarEventos(
        { q, categoriaId, orden, dir },
        req.user,
      ),
    );
  } catch (error) {
    return handleError(res, error);
  }
}

export function obtenerEvento(req, res) {
  try {
    return res.json(eventoService.obtenerEvento(req.params.id, req.user));
  } catch (error) {
    return handleError(res, error);
  }
}

export function crearEvento(req, res) {
  try {
    const evento = eventoService.crearEventoParaOrganizador(req.user, req.body);
    return res.status(201).json(evento);
  } catch (error) {
    return handleError(res, error);
  }
}

export function misEventos(req, res) {
  try {
    return res.json(eventoService.listarMisEventos(req.user));
  } catch (error) {
    return handleError(res, error);
  }
}

export function toggleFavorito(req, res) {
  try {
    const user = eventoService.toggleFavorito(req.user, req.params.eventoId);
    return res.json(user);
  } catch (error) {
    return handleError(res, error);
  }
}
