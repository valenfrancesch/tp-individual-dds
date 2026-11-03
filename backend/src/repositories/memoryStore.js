const store = {
  usuarios: [],
  categorias: [],
  eventos: [],
  compras: [],
  mensajes: [],
  resenias: [],
  cambiosEstado: [],
  counters: {
    usuario: 0,
    categoria: 0,
    evento: 0,
    tipoEntrada: 0,
    compra: 0,
    mensaje: 0,
    resenia: 0,
    cambioEstado: 0,
  },
};

export function getStore() {
  return store;
}

export function nextId(entity) {
  store.counters[entity] += 1;
  return `${entity}-${store.counters[entity]}`;
}

export function resetStore() {
  store.usuarios = [];
  store.categorias = [];
  store.eventos = [];
  store.compras = [];
  store.mensajes = [];
  store.resenias = [];
  store.cambiosEstado = [];
  Object.keys(store.counters).forEach((key) => {
    store.counters[key] = 0;
  });
}
