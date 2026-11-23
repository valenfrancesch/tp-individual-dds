import { crearRepositorio, getStore, nextId } from './memoryStore.js';

const base = crearRepositorio('eventos', 'evento');

export const { findAll, findById } = base;

export function save(evento) {
  evento.tiposEntrada.forEach((t) => {
    if (!t.id) t.id = nextId('tipoEntrada');
  });
  return base.save(evento);
}

export function findByOrganizador(organizador) {
  return getStore().eventos.filter((e) => e.esOrganizadoPor(organizador));
}
