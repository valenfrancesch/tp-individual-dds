import * as eventoRepository from '../repositories/eventoRepository.js';
import * as categoriaRepository from '../repositories/categoriaRepository.js';
import * as reseniaRepository from '../repositories/reseniaRepository.js';
import { Evento } from '../domain/Evento.js';
import { TipoEntrada } from '../domain/TipoEntrada.js';
import { badRequest, forbidden, notFound } from '../errors/AppError.js';

export function listarCategorias() {
  return categoriaRepository.findAll();
}

export function obtenerEvento(id) {
  const evento = eventoRepository.findById(id);
  if (!evento) throw notFound('Evento no encontrado');
  return evento;
}

function numeroOpcional(valor, nombre) {
  if (valor == null || valor === '') return null;
  const n = Number(valor);
  if (!Number.isFinite(n) || n < 0) {
    throw badRequest(`${nombre} debe ser un número mayor o igual a 0`);
  }
  return n;
}

/**
 * Filtros: q, categoriaId, precioMin, precioMax, soloFavoritos, proximos (oculta finalizados),
 * orden (precio|fecha|puntaje), dir (asc|desc)
 */
export function listarEventos(filtros, usuario) {
  const { q, categoriaId, orden, dir } = filtros;
  const precioMin = numeroOpcional(filtros.precioMin, 'precioMin');
  const precioMax = numeroOpcional(filtros.precioMax, 'precioMax');
  if (precioMin != null && precioMax != null && precioMin > precioMax) {
    throw badRequest('El precio mínimo no puede ser mayor al máximo');
  }
  const soloFavoritos = filtros.soloFavoritos === 'true' || filtros.soloFavoritos === true;
  const soloProximos = filtros.proximos === 'true' || filtros.proximos === true;
  const ahora = new Date();

  const eventos = eventoRepository.findAll().filter(
    (e) =>
      (!soloProximos || !e.yaSeRealizo(ahora)) &&
      e.coincideCon(q) &&
      (!categoriaId || e.categoria.id === categoriaId) &&
      e.tuPrecioEstaEntre(precioMin, precioMax) &&
      (!soloFavoritos || usuario.esFavorito(e)),
  );

  const sentido = dir === 'desc' ? -1 : 1;
  const puntaje = (e) => reseniaRepository.puntajeOrganizador(e.organizador).promedio;
  const comparadores = {
    precio: (a, b) => (a.precioMinimo() - b.precioMinimo()) * sentido,
    fecha: (a, b) => (a.fecha - b.fecha) * sentido,
    // Los organizadores sin reseñas quedan siempre al final.
    puntaje: (a, b) => {
      const pa = puntaje(a);
      const pb = puntaje(b);
      if (pa == null && pb == null) return 0;
      if (pa == null) return 1;
      if (pb == null) return -1;
      return (pa - pb) * sentido;
    },
  };
  const comparar = comparadores[orden];
  return comparar ? [...eventos].sort(comparar) : eventos;
}

export function crearEvento(usuario, payload = {}, ahora = new Date()) {
  if (!usuario.esOrganizador()) throw forbidden('Se requiere rol ORGANIZADOR');
  const categoria = categoriaRepository.findById(payload.categoriaId);
  if (!categoria) throw badRequest('Categoría no encontrada');
  if (!Array.isArray(payload.tiposEntrada) || !payload.tiposEntrada.length) {
    throw badRequest('El evento necesita al menos un tipo de entrada');
  }

  const evento = Evento.publicar(
    {
      nombre: payload.nombre,
      descripcion: payload.descripcion,
      categoria,
      fecha: payload.fecha,
      direccion: payload.direccion,
      multimedia: Array.isArray(payload.multimedia) ? payload.multimedia : [],
      organizador: usuario,
      tiposEntrada: payload.tiposEntrada.map((t) => new TipoEntrada(t)),
    },
    ahora,
  );
  return eventoRepository.save(evento);
}

export function listarMisEventos(usuario) {
  if (!usuario.esOrganizador()) throw forbidden('Se requiere rol ORGANIZADOR');
  return eventoRepository.findByOrganizador(usuario).sort((a, b) => a.fecha - b.fecha);
}

export function listarFavoritos(usuario) {
  return [...usuario.favoritos];
}

export function agregarFavorito(usuario, eventoId) {
  usuario.agregarFavorito(obtenerEvento(eventoId));
  return usuario;
}

export function quitarFavorito(usuario, eventoId) {
  usuario.quitarFavorito(obtenerEvento(eventoId));
  return usuario;
}
