import * as compraService from '../services/compraService.js';

function handleError(res, error) {
  const status = error.status || 500;
  return res.status(status).json({ error: error.message || 'Error interno' });
}

export function crear(req, res) {
  try {
    const compra = compraService.crearCompra(req.user, req.body);
    return res.status(201).json(compra);
  } catch (error) {
    return handleError(res, error);
  }
}

export function mias(req, res) {
  try {
    return res.json(compraService.listarMisCompras(req.user));
  } catch (error) {
    return handleError(res, error);
  }
}

export function obtener(req, res) {
  try {
    return res.json(compraService.obtenerCompra(req.user, req.params.id));
  } catch (error) {
    return handleError(res, error);
  }
}

export function porEvento(req, res) {
  try {
    return res.json(compraService.listarComprasDeEvento(req.user, req.params.id));
  } catch (error) {
    return handleError(res, error);
  }
}

export function pagar(req, res) {
  try {
    return res.json(compraService.pagarCompra(req.user, req.params.id));
  } catch (error) {
    return handleError(res, error);
  }
}

export function cancelar(req, res) {
  try {
    return res.json(compraService.cancelarCompra(req.user, req.params.id));
  } catch (error) {
    return handleError(res, error);
  }
}

export function utilizar(req, res) {
  try {
    return res.json(compraService.utilizarCompra(req.user, req.params.id));
  } catch (error) {
    return handleError(res, error);
  }
}
