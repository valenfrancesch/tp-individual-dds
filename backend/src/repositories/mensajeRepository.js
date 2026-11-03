import { getStore } from './memoryStore.js';

export function findByCompra(compraId) {
  return getStore().mensajes.filter((m) => m.compraId === compraId);
}

export function save(mensaje) {
  getStore().mensajes.push(mensaje);
  return mensaje;
}
