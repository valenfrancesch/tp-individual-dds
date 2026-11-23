import { crearRepositorio, getStore } from './memoryStore.js';

export const { findAll, findById, save } = crearRepositorio('compras', 'compra');

export function findByComprador(comprador) {
  return getStore().compras.filter((c) => c.esDelComprador(comprador));
}

export function findByEvento(evento) {
  return getStore().compras.filter((c) => c.evento === evento);
}
