import * as compraService from '../services/compraService.js';
import { compraJSON, compraDetalleJSON, mensajeJSON } from '../presenters/compraPresenter.js';
import { eventoJSON } from '../presenters/eventoPresenter.js';
import { reseniaJSON } from '../presenters/reseniaPresenter.js';

export function crear(req, res) {
  const compra = compraService.crearCompra(req.user, req.body);
  res.status(201).json(compraDetalleJSON(compra, req.user));
}

export function mias(req, res) {
  res.json(compraService.listarMisCompras(req.user).map((c) => compraJSON(c, req.user)));
}

export function obtener(req, res) {
  res.json(compraDetalleJSON(compraService.obtenerCompra(req.user, req.params.id), req.user));
}

/** Registra un cambio de estado ({ estado }): pagar, cancelar, utilizar o reembolsar. */
export function cambiarEstado(req, res) {
  const compra = compraService.cambiarEstado(req.user, req.params.id, req.body?.estado);
  res.status(201).json(compraDetalleJSON(compra, req.user));
}

export function listarMensajes(req, res) {
  const compra = compraService.obtenerCompra(req.user, req.params.id);
  res.json({
    compra: compraJSON(compra, req.user),
    mensajes: compra.mensajes.map(mensajeJSON),
  });
}

export function enviarMensaje(req, res) {
  const mensaje = compraService.enviarMensaje(req.user, req.params.id, req.body?.mensaje);
  res.status(201).json(mensajeJSON(mensaje));
}

export function reseniar(req, res) {
  const resenia = compraService.reseniar(req.user, req.params.id, req.body);
  res.status(201).json(reseniaJSON(resenia));
}

export function porEvento(req, res) {
  const { evento, compras, estadisticas } = compraService.comprasDeEvento(
    req.user,
    req.params.id,
    { estado: req.query.estado },
  );
  res.json({
    evento: eventoJSON(evento, req.user),
    compras: compras.map((c) => compraJSON(c, req.user)),
    estadisticas,
  });
}
