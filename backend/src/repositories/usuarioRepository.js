import { getStore } from './memoryStore.js';

export function findAll() {
  return getStore().usuarios;
}

export function findById(id) {
  return getStore().usuarios.find((u) => u.id === id) || null;
}

export function findByEmail(email) {
  return (
    getStore().usuarios.find(
      (u) => u.email.toLowerCase() === String(email).toLowerCase(),
    ) || null
  );
}

export function save(usuario) {
  getStore().usuarios.push(usuario);
  return usuario;
}

export function update(usuario) {
  const store = getStore();
  const index = store.usuarios.findIndex((u) => u.id === usuario.id);
  if (index === -1) return null;
  store.usuarios[index] = usuario;
  return usuario;
}
