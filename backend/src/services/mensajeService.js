import * as compraRepository from '../repositories/compraRepository.js';
import * as eventoRepository from '../repositories/eventoRepository.js';
import * as mensajeRepository from '../repositories/mensajeRepository.js';
import * as usuarioRepository from '../repositories/usuarioRepository.js';
import { crearMensaje } from '../domain/Mensaje.js';
import { nextId } from '../repositories/memoryStore.js';
import { usuarioPublico } from '../domain/Usuario.js';
import * as compraService from './compraService.js';

function assertPuedeChatear(usuario, compra) {
  const evento = eventoRepository.findById(compra.eventoId);
  const esComprador = compra.compradorId === usuario.id;
  const esOrganizador = evento?.organizadorId === usuario.id;
  if (!esComprador && !esOrganizador) {
    const error = new Error('No autorizado para el chat de esta compra');
    error.status = 403;
    throw error;
  }
  return evento;
}

export function listarMensajes(usuario, compraId) {
  const compra = compraRepository.findById(compraId);
  if (!compra) {
    const error = new Error('Compra no encontrada');
    error.status = 404;
    throw error;
  }
  assertPuedeChatear(usuario, compra);

  const compraEnriquecida = compraService.obtenerCompra(usuario, compraId);
  const mensajes = mensajeRepository.findByCompra(compraId).map((m) => ({
    ...m,
    usuario: usuarioPublico(usuarioRepository.findById(m.usuarioId)),
  }));

  return {
    compra: compraEnriquecida,
    evento: compraEnriquecida.evento,
    mensajes,
  };
}

export function enviarMensaje(usuario, compraId, texto) {
  if (!texto?.trim()) {
    const error = new Error('El mensaje no puede estar vacío');
    error.status = 400;
    throw error;
  }

  const compra = compraRepository.findById(compraId);
  if (!compra) {
    const error = new Error('Compra no encontrada');
    error.status = 404;
    throw error;
  }
  assertPuedeChatear(usuario, compra);

  const mensaje = crearMensaje({
    id: nextId('mensaje'),
    usuarioId: usuario.id,
    mensaje: texto.trim(),
  });
  mensaje.compraId = compraId;
  mensajeRepository.save(mensaje);

  if (!compra.mensajes.includes(mensaje.id)) {
    compra.mensajes.push(mensaje.id);
    compraRepository.update(compra);
  }

  return {
    ...mensaje,
    usuario: usuarioPublico(usuario),
  };
}
