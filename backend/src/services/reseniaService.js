import * as compraRepository from '../repositories/compraRepository.js';
import * as eventoRepository from '../repositories/eventoRepository.js';
import * as reseniaRepository from '../repositories/reseniaRepository.js';
import * as usuarioRepository from '../repositories/usuarioRepository.js';
import { crearResenia } from '../domain/Resenia.js';
import { EstadoCompra } from '../domain/EstadoCompra.js';
import { nextId } from '../repositories/memoryStore.js';
import { usuarioPublico } from '../domain/Usuario.js';
import { Roles, tieneRol } from '../domain/Roles.js';

export function crearReseniaDeCompra(usuario, compraId, payload) {
  const compra = compraRepository.findById(compraId);
  if (!compra) {
    const error = new Error('Compra no encontrada');
    error.status = 404;
    throw error;
  }
  if (compra.compradorId !== usuario.id) {
    const error = new Error('Solo el comprador puede reseñar');
    error.status = 403;
    throw error;
  }
  if (compra.estado !== EstadoCompra.UTILIZADA) {
    const error = new Error('Solo se puede reseñar una compra utilizada');
    error.status = 400;
    throw error;
  }

  const existente = reseniaRepository.findByCompra(compraId);
  if (existente) {
    const error = new Error('Ya existe una reseña para esta compra');
    error.status = 400;
    throw error;
  }

  const { detalle, puntuacion } = payload;
  if (puntuacion == null || Number(puntuacion) < 1 || Number(puntuacion) > 5) {
    const error = new Error('La puntuación debe estar entre 1 y 5');
    error.status = 400;
    throw error;
  }

  const evento = eventoRepository.findById(compra.eventoId);
  const resenia = crearResenia({
    id: nextId('resenia'),
    compradorId: usuario.id,
    eventoId: evento.id,
    organizadorId: evento.organizadorId,
    detalle,
    puntuacion,
  });
  resenia.compraId = compraId;
  reseniaRepository.save(resenia);

  return {
    ...resenia,
    comprador: usuarioPublico(usuario),
  };
}

export function listarReseniasOrganizador(organizadorId) {
  return reseniaRepository.findByOrganizador(organizadorId).map((r) => ({
    ...r,
    comprador: usuarioPublico(usuarioRepository.findById(r.compradorId)),
    evento: eventoRepository.findById(r.eventoId),
  }));
}

export function listarMisReseniasComoOrganizador(usuario) {
  if (!tieneRol(usuario, Roles.ORGANIZADOR)) {
    const error = new Error('Se requiere rol ORGANIZADOR');
    error.status = 403;
    throw error;
  }
  return listarReseniasOrganizador(usuario.id);
}
