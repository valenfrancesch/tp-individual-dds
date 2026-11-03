import { getStore } from './memoryStore.js';

export function findAll() {
  return getStore().compras;
}

export function findById(id) {
  return getStore().compras.find((c) => c.id === id) || null;
}

export function findByComprador(compradorId) {
  return getStore().compras.filter((c) => c.compradorId === compradorId);
}

export function findByEvento(eventoId) {
  return getStore().compras.filter((c) => c.eventoId === eventoId);
}

export function save(compra) {
  getStore().compras.push(compra);
  return compra;
}

export function update(compra) {
  const store = getStore();
  const index = store.compras.findIndex((c) => c.id === compra.id);
  if (index === -1) return null;
  store.compras[index] = compra;
  return compra;
}

export function saveCambioEstado(cambio) {
  getStore().cambiosEstado.push(cambio);
  return cambio;
}

export function findCambiosByCompra(compraId) {
  return getStore().cambiosEstado.filter((c) => c.compraId === compraId);
}
