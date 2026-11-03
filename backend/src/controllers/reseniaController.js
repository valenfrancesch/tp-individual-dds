import * as reseniaService from '../services/reseniaService.js';

function handleError(res, error) {
  const status = error.status || 500;
  return res.status(status).json({ error: error.message || 'Error interno' });
}

export function crear(req, res) {
  try {
    const resenia = reseniaService.crearReseniaDeCompra(
      req.user,
      req.params.id,
      req.body,
    );
    return res.status(201).json(resenia);
  } catch (error) {
    return handleError(res, error);
  }
}

export function porOrganizador(req, res) {
  try {
    return res.json(reseniaService.listarReseniasOrganizador(req.params.id));
  } catch (error) {
    return handleError(res, error);
  }
}

export function mias(req, res) {
  try {
    return res.json(reseniaService.listarMisReseniasComoOrganizador(req.user));
  } catch (error) {
    return handleError(res, error);
  }
}
