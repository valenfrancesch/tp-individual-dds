import { getStore } from './memoryStore.js';

export function findAll() {
  return getStore().resenias;
}

export function findByOrganizador(organizadorId) {
  return getStore().resenias.filter((r) => r.organizadorId === organizadorId);
}

export function findByEvento(eventoId) {
  return getStore().resenias.filter((r) => r.eventoId === eventoId);
}

export function findByCompra(compraId) {
  return getStore().resenias.find((r) => r.compraId === compraId) || null;
}

export function save(resenia) {
  getStore().resenias.push(resenia);
  return resenia;
}
