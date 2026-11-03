import * as eventoRepository from '../repositories/eventoRepository.js';
import * as categoriaRepository from '../repositories/categoriaRepository.js';
import * as usuarioRepository from '../repositories/usuarioRepository.js';
import * as reseniaRepository from '../repositories/reseniaRepository.js';
import * as compraRepository from '../repositories/compraRepository.js';
import { crearEvento, precioMinimo } from '../domain/Evento.js';
import { crearTipoEntrada } from '../domain/TipoEntrada.js';
import { EstadoCompra } from '../domain/EstadoCompra.js';
import { nextId } from '../repositories/memoryStore.js';
import { Roles, tieneRol } from '../domain/Roles.js';
import { usuarioPublico } from '../domain/Usuario.js';

function puntajeOrganizador(organizadorId) {
  const resenias = reseniaRepository.findByOrganizador(organizadorId);
  if (!resenias.length) return null;
  const sum = resenias.reduce((acc, r) => acc + r.puntuacion, 0);
  return sum / resenias.length;
}

function enriquecerEvento(evento, usuarioActual = null) {
  const categoria = categoriaRepository.findById(evento.categoriaId);
  const organizador = usuarioRepository.findById(evento.organizadorId);
  const reseniasOrganizador = reseniaRepository
    .findByOrganizador(evento.organizadorId)
    .map((r) => ({
      ...r,
      comprador: usuarioPublico(usuarioRepository.findById(r.compradorId)),
      evento: eventoRepository.findById(r.eventoId),
    }));

  let puedeReseniar = false;
  let compraUtilizadaId = null;
  if (usuarioActual) {
    const compra = compraRepository
      .findByComprador(usuarioActual.id)
      .find(
        (c) =>
          c.eventoId === evento.id &&
          c.estado === EstadoCompra.UTILIZADA &&
          !reseniaRepository.findByCompra(c.id),
      );
    if (compra) {
      puedeReseniar = true;
      compraUtilizadaId = compra.id;
    }
  }

  const puntaje = puntajeOrganizador(evento.organizadorId);

  return {
    ...evento,
    precioDesde: precioMinimo(evento),
    categoria,
    organizador: usuarioPublico(organizador),
    puntajeOrganizador: puntaje,
    cantidadResenias: reseniasOrganizador.length,
    reseniasOrganizador,
    puedeReseniar,
    compraUtilizadaId,
  };
}

export function listarCategorias() {
  return categoriaRepository.findAll();
}

export function listarEventos({ q, categoriaId, orden, dir } = {}, usuario = null) {
  let eventos = eventoRepository
    .findAll()
    .map((e) => enriquecerEvento(e, usuario));

  if (q) {
    const query = String(q).toLowerCase();
    eventos = eventos.filter(
      (e) =>
        e.nombre.toLowerCase().includes(query) ||
        e.descripcion.toLowerCase().includes(query) ||
        (e.direccion || '').toLowerCase().includes(query),
    );
  }

  if (categoriaId) {
    eventos = eventos.filter((e) => e.categoriaId === categoriaId);
  }

  const direction = dir === 'desc' ? -1 : 1;
  const defaultDir =
    orden === 'puntaje' ? (dir ? direction : -1) : direction;

  if (orden === 'precio') {
    eventos.sort((a, b) => (a.precioDesde - b.precioDesde) * defaultDir);
  } else if (orden === 'fecha') {
    eventos.sort(
      (a, b) => (new Date(a.fecha) - new Date(b.fecha)) * defaultDir,
    );
  } else if (orden === 'puntaje') {
    eventos.sort((a, b) => {
      const pa = a.puntajeOrganizador ?? -1;
      const pb = b.puntajeOrganizador ?? -1;
      return (pa - pb) * defaultDir;
    });
  }

  return eventos;
}

export function obtenerEvento(id, usuario = null) {
  const evento = eventoRepository.findById(id);
  if (!evento) {
    const error = new Error('Evento no encontrado');
    error.status = 404;
    throw error;
  }
  return enriquecerEvento(evento, usuario);
}

export function crearEventoParaOrganizador(usuario, payload) {
  if (!tieneRol(usuario, Roles.ORGANIZADOR)) {
    const error = new Error('Se requiere rol ORGANIZADOR');
    error.status = 403;
    throw error;
  }

  const {
    nombre,
    descripcion,
    categoriaId,
    fecha,
    direccion,
    tiposEntrada,
    multimedia,
  } = payload;

  if (!nombre || !categoriaId || !fecha || !tiposEntrada?.length) {
    const error = new Error(
      'nombre, categoriaId, fecha y tiposEntrada son obligatorios',
    );
    error.status = 400;
    throw error;
  }

  const categoria = categoriaRepository.findById(categoriaId);
  if (!categoria) {
    const error = new Error('Categoría no encontrada');
    error.status = 400;
    throw error;
  }

  const tipos = tiposEntrada.map((t) =>
    crearTipoEntrada({
      id: nextId('tipoEntrada'),
      nombre: t.nombre,
      descripcion: t.descripcion,
      precio: t.precio,
      cupo: t.cupo,
    }),
  );

  const evento = crearEvento({
    id: nextId('evento'),
    nombre,
    descripcion,
    categoriaId,
    fecha,
    direccion: direccion || '',
    tiposEntrada: tipos,
    multimedia: multimedia || [],
    organizadorId: usuario.id,
  });

  eventoRepository.save(evento);
  return enriquecerEvento(evento, usuario);
}

export function toggleFavorito(usuario, eventoId) {
  const evento = eventoRepository.findById(eventoId);
  if (!evento) {
    const error = new Error('Evento no encontrado');
    error.status = 404;
    throw error;
  }

  const actual = usuarioRepository.findById(usuario.id);
  const index = actual.favoritos.indexOf(eventoId);
  if (index >= 0) {
    actual.favoritos.splice(index, 1);
  } else {
    actual.favoritos.push(eventoId);
  }
  usuarioRepository.update(actual);
  return usuarioPublico(actual);
}

export function listarMisEventos(usuario) {
  if (!tieneRol(usuario, Roles.ORGANIZADOR)) {
    const error = new Error('Se requiere rol ORGANIZADOR');
    error.status = 403;
    throw error;
  }
  return eventoRepository
    .findByOrganizador(usuario.id)
    .map((e) => enriquecerEvento(e, usuario));
}
