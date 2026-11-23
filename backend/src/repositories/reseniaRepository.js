import { crearRepositorio, getStore } from './memoryStore.js';

export const { findAll, findById, save } = crearRepositorio('resenias', 'resenia');

export function findByOrganizador(organizador) {
  return getStore().resenias.filter((r) => r.organizador.id === organizador.id);
}

export function puntajeOrganizador(organizador) {
  const resenias = findByOrganizador(organizador);
  if (!resenias.length) return { promedio: null, cantidad: 0 };
  const suma = resenias.reduce((acc, r) => acc + r.puntuacion, 0);
  return { promedio: suma / resenias.length, cantidad: resenias.length };
}
