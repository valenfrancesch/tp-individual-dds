/**
 * "Base de datos" en memoria. Cada colección guarda instancias de dominio;
 * los mensajes y el historial de estados viven dentro de cada Compra.
 */
const store = {
  usuarios: [],
  categorias: [],
  eventos: [],
  compras: [],
  resenias: [],
  counters: {},
};

export function getStore() {
  return store;
}

export function nextId(entity) {
  store.counters[entity] = (store.counters[entity] || 0) + 1;
  return `${entity}-${store.counters[entity]}`;
}

export function resetStore() {
  store.usuarios = [];
  store.categorias = [];
  store.eventos = [];
  store.compras = [];
  store.resenias = [];
  store.counters = {};
}

/**
 * Crea un repositorio básico sobre una colección del store.
 * `save` asigna id si la entidad no lo tiene.
 */
export function crearRepositorio(coleccion, prefijo) {
  return {
    findAll: () => store[coleccion],
    findById: (id) => store[coleccion].find((e) => e.id === id) || null,
    save(entidad) {
      if (!entidad.id) entidad.id = nextId(prefijo);
      if (!store[coleccion].includes(entidad)) store[coleccion].push(entidad);
      return entidad;
    },
  };
}
