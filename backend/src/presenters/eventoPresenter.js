import * as reseniaRepository from '../repositories/reseniaRepository.js';
import { usuarioResumen } from './usuarioPresenter.js';
import { reseniaJSON } from './reseniaPresenter.js';

export function tipoEntradaJSON(tipo) {
  return {
    id: tipo.id,
    nombre: tipo.nombre,
    descripcion: tipo.descripcion,
    precio: tipo.precio,
    cupo: tipo.cupo,
  };
}

/** Versión corta, para anidar dentro de compras y reseñas. */
export function eventoResumen(evento) {
  return {
    id: evento.id,
    nombre: evento.nombre,
    fecha: evento.fecha.toISOString(),
    direccion: evento.direccion,
    imagen: evento.multimedia[0] || null,
    organizador: usuarioResumen(evento.organizador),
  };
}

export function eventoJSON(evento, usuario = null, ahora = new Date()) {
  const { promedio, cantidad } = reseniaRepository.puntajeOrganizador(evento.organizador);
  return {
    id: evento.id,
    nombre: evento.nombre,
    descripcion: evento.descripcion,
    fecha: evento.fecha.toISOString(),
    direccion: evento.direccion,
    multimedia: [...evento.multimedia],
    categoria: { ...evento.categoria },
    tiposEntrada: evento.tiposEntrada.map(tipoEntradaJSON),
    precioDesde: evento.precioMinimo(),
    cupoDisponible: evento.cupoTotalDisponible(),
    organizador: usuarioResumen(evento.organizador),
    puntajeOrganizador: promedio,
    cantidadResenias: cantidad,
    yaSeRealizo: evento.yaSeRealizo(ahora),
    esFavorito: !!usuario && usuario.esFavorito(evento),
    esMio: evento.esOrganizadoPor(usuario),
  };
}

/** Detalle: agrega las reseñas de todos los eventos del organizador. */
export function eventoDetalleJSON(evento, usuario = null, ahora = new Date()) {
  return {
    ...eventoJSON(evento, usuario, ahora),
    reseniasOrganizador: reseniaRepository
      .findByOrganizador(evento.organizador)
      .map(reseniaJSON),
  };
}
