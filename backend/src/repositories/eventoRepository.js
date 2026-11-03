import { getStore } from './memoryStore.js';

export function findAll() {
  return getStore().eventos;
}

export function findById(id) {
  return getStore().eventos.find((e) => e.id === id) || null;
}

export function findByOrganizador(organizadorId) {
  return getStore().eventos.filter((e) => e.organizadorId === organizadorId);
}

export function save(evento) {
  getStore().eventos.push(evento);
  return evento;
}

export function update(evento) {
  const store = getStore();
  const index = store.eventos.findIndex((e) => e.id === evento.id);
  if (index === -1) return null;
  store.eventos[index] = evento;
  return evento;
}
