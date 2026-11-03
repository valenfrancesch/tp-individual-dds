export const EstadoCompra = Object.freeze({
  PENDIENTE: 'PENDIENTE',
  CONFIRMADA: 'CONFIRMADA',
  UTILIZADA: 'UTILIZADA',
  CANCELADA: 'CANCELADA',
  REEMBOLSADA: 'REEMBOLSADA',
});

const TRANSICIONES = {
  [EstadoCompra.PENDIENTE]: [EstadoCompra.CONFIRMADA, EstadoCompra.CANCELADA],
  [EstadoCompra.CONFIRMADA]: [EstadoCompra.UTILIZADA, EstadoCompra.CANCELADA],
  [EstadoCompra.CANCELADA]: [EstadoCompra.REEMBOLSADA],
  [EstadoCompra.UTILIZADA]: [],
  [EstadoCompra.REEMBOLSADA]: [],
};

export function puedeTransicionar(desde, hacia) {
  return (TRANSICIONES[desde] || []).includes(hacia);
}
