/** Presentación de los estados de compra: etiqueta, color e ícono. */
export const ESTADOS = {
  PENDIENTE: {
    label: 'Pendiente de pago',
    color: '#92400e',
    bg: '#fef3c7',
    icon: 'time-outline',
  },
  CONFIRMADA: {
    label: 'Confirmada',
    color: '#065f46',
    bg: '#d1fae5',
    icon: 'checkmark-circle-outline',
  },
  UTILIZADA: {
    label: 'Utilizada',
    color: '#1e40af',
    bg: '#dbeafe',
    icon: 'ticket-outline',
  },
  CANCELADA: {
    label: 'Cancelada',
    color: '#991b1b',
    bg: '#fee2e2',
    icon: 'close-circle-outline',
  },
  REEMBOLSADA: {
    label: 'Reembolsada',
    color: '#374151',
    bg: '#e5e7eb',
    icon: 'cash-outline',
  },
};

export const ORDEN_ESTADOS = ['PENDIENTE', 'CONFIRMADA', 'UTILIZADA', 'CANCELADA', 'REEMBOLSADA'];

export function labelEstado(estado) {
  return ESTADOS[estado]?.label || estado;
}
