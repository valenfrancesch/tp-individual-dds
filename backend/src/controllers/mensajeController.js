import * as mensajeService from '../services/mensajeService.js';

function handleError(res, error) {
  const status = error.status || 500;
  return res.status(status).json({ error: error.message || 'Error interno' });
}

export function listar(req, res) {
  try {
    return res.json(mensajeService.listarMensajes(req.user, req.params.id));
  } catch (error) {
    return handleError(res, error);
  }
}

export function enviar(req, res) {
  try {
    const mensaje = mensajeService.enviarMensaje(
      req.user,
      req.params.id,
      req.body?.mensaje,
    );
    return res.status(201).json(mensaje);
  } catch (error) {
    return handleError(res, error);
  }
}
