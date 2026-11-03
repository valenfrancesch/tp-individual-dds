import { getStore } from './memoryStore.js';

export function findAll() {
  return getStore().categorias;
}

export function findById(id) {
  return getStore().categorias.find((c) => c.id === id) || null;
}

export function save(categoria) {
  getStore().categorias.push(categoria);
  return categoria;
}
