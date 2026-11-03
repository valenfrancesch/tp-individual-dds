import { EstadoCompra, puedeTransicionar } from './EstadoCompra.js';

export function crearItemCompra({
  tipoEntradaId,
  cantidad,
  precioUnitario,
}) {
  const qty = Number(cantidad);
  const precio = Number(precioUnitario);
  return {
    tipoEntradaId,
    cantidad: qty,
    precioUnitario: precio,
    subtotal: precio * qty,
  };
}

export function crearCompra({
  id,
  compradorId,
  eventoId,
  items = [],
  total,
  estado = EstadoCompra.PENDIENTE,
  mensajes = [],
}) {
  return {
    id,
    compradorId,
    eventoId,
    items: items.map((item) => ({ ...item })),
    total: Number(total),
    estado,
    mensajes: [...mensajes],
  };
}

export function actualizarEstado(compra, nuevoEstado) {
  if (!puedeTransicionar(compra.estado, nuevoEstado)) {
    const error = new Error(
      `Transición inválida: ${compra.estado} → ${nuevoEstado}`,
    );
    error.status = 400;
    throw error;
  }
  compra.estado = nuevoEstado;
  return compra;
}

export function diasHastaEvento(fechaEvento, desde = new Date()) {
  const evento = new Date(fechaEvento);
  const base = new Date(desde);
  evento.setHours(0, 0, 0, 0);
  base.setHours(0, 0, 0, 0);
  const diff = Math.ceil((evento - base) / (1000 * 60 * 60 * 24));
  return diff;
}
