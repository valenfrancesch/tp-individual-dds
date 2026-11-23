import { crearRepositorio, getStore } from './memoryStore.js';

const base = crearRepositorio('usuarios', 'usuario');

export const { findAll, findById, save } = base;

export function findByEmail(email) {
  const buscado = String(email ?? '').trim().toLowerCase();
  return getStore().usuarios.find((u) => u.email.toLowerCase() === buscado) || null;
}
