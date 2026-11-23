import * as compraRepository from '../repositories/compraRepository.js';
import * as reseniaRepository from '../repositories/reseniaRepository.js';
import { Compra } from '../domain/Compra.js';
import { EstadoCompra, esEstadoValido } from '../domain/EstadoCompra.js';
import { badRequest, forbidden, notFound } from '../errors/AppError.js';
import { obtenerEvento } from './eventoService.js';

/** Busca la compra y verifica que el usuario sea su comprador u organizador. */
export function obtenerCompra(usuario, compraId) {
  const compra = compraRepository.findById(compraId);
  if (!compra) throw notFound('Compra no encontrada');
  if (!compra.esParticipante(usuario)) throw forbidden('No participás de esta compra');
  return compra;
}

export function crearCompra(usuario, payload = {}, ahora = new Date()) {
  const { eventoId, tipoEntradaId, cantidad } = payload;
  if (!eventoId || !tipoEntradaId) {
    throw badRequest('eventoId y tipoEntradaId son obligatorios');
  }
  const evento = obtenerEvento(eventoId);
  const compra = Compra.crear({ comprador: usuario, evento, tipoEntradaId, cantidad }, ahora);
  return compraRepository.save(compra);
}

export function listarMisCompras(usuario) {
  return compraRepository.findByComprador(usuario).sort((a, b) => b.fecha - a.fecha);
}

/** Estado destino → operación de dominio que lo produce (cada una valida sus reglas). */
const OPERACION_POR_ESTADO = Object.freeze({
  [EstadoCompra.CONFIRMADA]: 'pagar',
  [EstadoCompra.CANCELADA]: 'cancelar',
  [EstadoCompra.UTILIZADA]: 'utilizar',
  [EstadoCompra.REEMBOLSADA]: 'marcarReembolsada',
});

/** Registra un cambio de estado en la compra delegando en el dominio. */
export function cambiarEstado(usuario, compraId, estado, ahora = new Date()) {
  const operacion = OPERACION_POR_ESTADO[estado];
  if (!operacion) {
    throw badRequest(`estado debe ser uno de: ${Object.keys(OPERACION_POR_ESTADO).join(', ')}`);
  }
  const compra = obtenerCompra(usuario, compraId);
  compra[operacion](usuario, ahora);
  return compra;
}

export function enviarMensaje(usuario, compraId, texto, ahora = new Date()) {
  const compra = obtenerCompra(usuario, compraId);
  return compra.agregarMensaje(usuario, texto, ahora);
}

export function reseniar(usuario, compraId, payload, ahora = new Date()) {
  const compra = obtenerCompra(usuario, compraId);
  const resenia = compra.reseniar(usuario, payload ?? {}, ahora);
  return reseniaRepository.save(resenia);
}

export function comprasDeEvento(usuario, eventoId, { estado } = {}) {
  const evento = obtenerEvento(eventoId);
  if (!evento.esOrganizadoPor(usuario)) {
    throw forbidden('Solo el organizador puede ver las compras del evento');
  }
  if (estado && !esEstadoValido(estado)) throw badRequest(`Estado inválido: ${estado}`);

  const todas = compraRepository.findByEvento(evento);
  const porEstado = Object.fromEntries(Object.values(EstadoCompra).map((e) => [e, 0]));
  todas.forEach((c) => {
    porEstado[c.estado] += 1;
  });

  const sumar = (tipo, estados) =>
    todas
      .filter((c) => c.tipoEntrada === tipo && estados.includes(c.estado))
      .reduce((acc, c) => acc + c.cantidad, 0);

  const porTipo = evento.tiposEntrada.map((t) => ({
    id: t.id,
    nombre: t.nombre,
    precio: t.precio,
    vendidas: sumar(t, [EstadoCompra.CONFIRMADA, EstadoCompra.UTILIZADA]),
    pendientes: sumar(t, [EstadoCompra.PENDIENTE]),
    disponibles: t.cupo,
  }));

  const compras = (estado ? todas.filter((c) => c.estado === estado) : todas).sort(
    (a, b) => b.fecha - a.fecha,
  );

  return { evento, compras, estadisticas: { porEstado, porTipo } };
}
