import { API_URL } from './config';

let authToken = null;
let onUnauthorized = null;

export function setAuthToken(token) {
  authToken = token;
}

/** Callback para cerrar sesión si el backend responde 401 (token vencido). */
export function setOnUnauthorized(callback) {
  onUnauthorized = callback;
}

export async function api(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch {
    const error = new Error(
      `No se pudo conectar con el servidor (${API_URL}). Revisá que el backend esté corriendo.`,
    );
    error.network = true;
    throw error;
  }

  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { error: text };
  }

  if (!response.ok) {
    if (response.status === 401 && authToken && onUnauthorized) onUnauthorized();
    const error = new Error(data?.error || `Error ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return data;
}

const post = (path, body) =>
  api(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined });

function queryString(params) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '' && v !== false) qs.set(k, String(v));
  });
  const s = qs.toString();
  return s ? `?${s}` : '';
}

export const AuthApi = {
  seedUsers: () => api('/api/auth/seed-users'),
  login: (email, password) => post('/api/auth/login', { email, password }),
  me: () => api('/api/auth/me'),
};

export const EventosApi = {
  categorias: () => api('/api/categorias'),
  /** params: q, categoriaId, precioMin, precioMax, soloFavoritos, orden, dir */
  listar: (params = {}) => api(`/api/eventos${queryString(params)}`),
  obtener: (id) => api(`/api/eventos/${id}`),
  crear: (payload) => post('/api/eventos', payload),
  mios: () => api('/api/eventos/mios'),
  favoritos: () => api('/api/usuarios/me/favoritos'),
  agregarFavorito: (eventoId) => post(`/api/usuarios/me/favoritos/${eventoId}`),
  quitarFavorito: (eventoId) =>
    api(`/api/usuarios/me/favoritos/${eventoId}`, { method: 'DELETE' }),
};

export const ComprasApi = {
  crear: ({ eventoId, tipoEntradaId, cantidad }) =>
    post('/api/compras', { eventoId, tipoEntradaId, cantidad }),
  mias: () => api('/api/compras/mias'),
  obtener: (id) => api(`/api/compras/${id}`),
  porEvento: (eventoId, estado) =>
    api(`/api/eventos/${eventoId}/compras${queryString({ estado })}`),
  pagar: (id) => post(`/api/compras/${id}/pagar`),
  cancelar: (id) => post(`/api/compras/${id}/cancelar`),
  utilizar: (id) => post(`/api/compras/${id}/utilizar`),
  reembolsar: (id) => post(`/api/compras/${id}/reembolsar`),
  mensajes: (id) => api(`/api/compras/${id}/mensajes`),
  enviarMensaje: (id, mensaje) => post(`/api/compras/${id}/mensajes`, { mensaje }),
  reseniar: (id, { puntuacion, detalle }) =>
    post(`/api/compras/${id}/resenia`, { puntuacion, detalle }),
};

export const ReseniasApi = {
  recibidas: () => api('/api/organizadores/me/resenias'),
};
