export const EstadoCompra = Object.freeze({
  PENDIENTE: 'PENDIENTE',
  CONFIRMADA: 'CONFIRMADA',
  UTILIZADA: 'UTILIZADA',
  CANCELADA: 'CANCELADA',
  REEMBOLSADA: 'REEMBOLSADA',
});

/**
 * Máquina de estados de una compra.
 *  PENDIENTE  → CONFIRMADA (pago) | CANCELADA
 *  CONFIRMADA → UTILIZADA (ingreso al evento) | CANCELADA
 *  CANCELADA  → REEMBOLSADA (el organizador registra la devolución)
 */
const TRANSICIONES = Object.freeze({
  [EstadoCompra.PENDIENTE]: [EstadoCompra.CONFIRMADA, EstadoCompra.CANCELADA],
  [EstadoCompra.CONFIRMADA]: [EstadoCompra.UTILIZADA, EstadoCompra.CANCELADA],
  [EstadoCompra.CANCELADA]: [EstadoCompra.REEMBOLSADA],
  [EstadoCompra.UTILIZADA]: [],
  [EstadoCompra.REEMBOLSADA]: [],
});

export function puedeTransicionar(desde, hacia) {
  return (TRANSICIONES[desde] || []).includes(hacia);
}

export function esEstadoValido(estado) {
  return Object.values(EstadoCompra).includes(estado);
}
