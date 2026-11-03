import * as compraRepository from '../repositories/compraRepository.js';
import * as eventoRepository from '../repositories/eventoRepository.js';
import * as usuarioRepository from '../repositories/usuarioRepository.js';
import {
  crearCompra as buildCompra,
  crearItemCompra,
  actualizarEstado,
  diasHastaEvento,
} from '../domain/Compra.js';
import { EstadoCompra } from '../domain/EstadoCompra.js';
import { hayCupoPara } from '../domain/TipoEntrada.js';
import { crearCambioEstadoCompra } from '../domain/CambioEstadoCompra.js';
import { nextId } from '../repositories/memoryStore.js';
import { Roles, tieneRol } from '../domain/Roles.js';
import { usuarioPublico } from '../domain/Usuario.js';

function encontrarTipo(evento, tipoEntradaId) {
  return evento.tiposEntrada.find((t) => t.id === tipoEntradaId) || null;
}

function enriquecerItems(compra, evento) {
  return (compra.items || []).map((item) => {
    const tipo = encontrarTipo(evento, item.tipoEntradaId);
    return {
      ...item,
      tipoEntrada: tipo,
    };
  });
}

function enriquecerCompra(compra) {
  const evento = eventoRepository.findById(compra.eventoId);
  const comprador = usuarioRepository.findById(compra.compradorId);
  const items = enriquecerItems(compra, evento);

  return {
    ...compra,
    evento,
    comprador: usuarioPublico(comprador),
    items,
    // compat lectura UI: resumen
    resumenItems: items
      .map((i) => `${i.tipoEntrada?.nombre || i.tipoEntradaId} × ${i.cantidad}`)
      .join(', '),
    diasRestantes:
      compra.estado === EstadoCompra.CONFIRMADA && evento
        ? diasHastaEvento(evento.fecha)
        : null,
  };
}

function registrarCambio(compraId, estado, quienId) {
  compraRepository.saveCambioEstado(
    crearCambioEstadoCompra({
      id: nextId('cambioEstado'),
      compraId,
      estado,
      quienId,
    }),
  );
}

function normalizarItemsPayload(payload) {
  if (Array.isArray(payload.items) && payload.items.length) {
    return payload.items;
  }
  // compat legacy: un solo tipo
  if (payload.tipoEntradaId && payload.cantidad) {
    return [
      { tipoEntradaId: payload.tipoEntradaId, cantidad: payload.cantidad },
    ];
  }
  return [];
}

export function crearCompra(usuario, payload) {
  if (!tieneRol(usuario, Roles.COMPRADOR)) {
    const error = new Error('Se requiere rol COMPRADOR');
    error.status = 403;
    throw error;
  }

  const { eventoId } = payload;
  const rawItems = normalizarItemsPayload(payload).filter(
    (i) => Number(i.cantidad) > 0,
  );

  if (!eventoId || !rawItems.length) {
    const error = new Error('eventoId e items con cantidad > 0 son obligatorios');
    error.status = 400;
    throw error;
  }

  const evento = eventoRepository.findById(eventoId);
  if (!evento) {
    const error = new Error('Evento no encontrado');
    error.status = 404;
    throw error;
  }

  const items = [];
  for (const raw of rawItems) {
    const tipo = encontrarTipo(evento, raw.tipoEntradaId);
    if (!tipo) {
      const error = new Error(`Tipo de entrada no encontrado: ${raw.tipoEntradaId}`);
      error.status = 400;
      throw error;
    }
    if (!hayCupoPara(tipo, raw.cantidad)) {
      const error = new Error(
        `No hay cupo suficiente para ${tipo.nombre} (solicitado: ${raw.cantidad}, disponible: ${tipo.cupo})`,
      );
      error.status = 400;
      throw error;
    }
    items.push(
      crearItemCompra({
        tipoEntradaId: tipo.id,
        cantidad: raw.cantidad,
        precioUnitario: tipo.precio,
      }),
    );
  }

  const total = items.reduce((acc, i) => acc + i.subtotal, 0);
  const compra = buildCompra({
    id: nextId('compra'),
    compradorId: usuario.id,
    eventoId,
    items,
    total,
    estado: EstadoCompra.PENDIENTE,
  });

  compraRepository.save(compra);
  registrarCambio(compra.id, EstadoCompra.PENDIENTE, usuario.id);
  return enriquecerCompra(compra);
}

export function pagarCompra(usuario, compraId) {
  const compra = compraRepository.findById(compraId);
  if (!compra) {
    const error = new Error('Compra no encontrada');
    error.status = 404;
    throw error;
  }
  if (compra.compradorId !== usuario.id) {
    const error = new Error('No autorizado');
    error.status = 403;
    throw error;
  }

  const evento = eventoRepository.findById(compra.eventoId);
  for (const item of compra.items) {
    const tipo = encontrarTipo(evento, item.tipoEntradaId);
    if (!hayCupoPara(tipo, item.cantidad)) {
      const error = new Error(`No hay cupo suficiente para ${tipo?.nombre}`);
      error.status = 400;
      throw error;
    }
  }

  for (const item of compra.items) {
    const tipo = encontrarTipo(evento, item.tipoEntradaId);
    tipo.cupo -= item.cantidad;
  }

  actualizarEstado(compra, EstadoCompra.CONFIRMADA);
  eventoRepository.update(evento);
  compraRepository.update(compra);
  registrarCambio(compra.id, EstadoCompra.CONFIRMADA, usuario.id);
  return enriquecerCompra(compra);
}

export function cancelarCompra(usuario, compraId) {
  const compra = compraRepository.findById(compraId);
  if (!compra) {
    const error = new Error('Compra no encontrada');
    error.status = 404;
    throw error;
  }

  const evento = eventoRepository.findById(compra.eventoId);
  const esComprador = compra.compradorId === usuario.id;
  const esOrganizador = evento?.organizadorId === usuario.id;

  if (!esComprador && !esOrganizador) {
    const error = new Error('No autorizado');
    error.status = 403;
    throw error;
  }

  if (compra.estado === EstadoCompra.UTILIZADA) {
    const error = new Error('No se puede cancelar una compra utilizada');
    error.status = 400;
    throw error;
  }

  if (new Date(evento.fecha) < new Date()) {
    const error = new Error('No se puede cancelar: el evento ya se realizó');
    error.status = 400;
    throw error;
  }

  if (
    ![EstadoCompra.PENDIENTE, EstadoCompra.CONFIRMADA].includes(compra.estado)
  ) {
    const error = new Error(`No se puede cancelar desde estado ${compra.estado}`);
    error.status = 400;
    throw error;
  }

  const eraConfirmada = compra.estado === EstadoCompra.CONFIRMADA;
  actualizarEstado(compra, EstadoCompra.CANCELADA);
  registrarCambio(compra.id, EstadoCompra.CANCELADA, usuario.id);

  if (eraConfirmada) {
    for (const item of compra.items) {
      const tipo = encontrarTipo(evento, item.tipoEntradaId);
      tipo.cupo += item.cantidad;
    }
    eventoRepository.update(evento);
  }

  actualizarEstado(compra, EstadoCompra.REEMBOLSADA);
  registrarCambio(compra.id, EstadoCompra.REEMBOLSADA, usuario.id);
  compraRepository.update(compra);

  return enriquecerCompra(compra);
}

export function utilizarCompra(usuario, compraId) {
  const compra = compraRepository.findById(compraId);
  if (!compra) {
    const error = new Error('Compra no encontrada');
    error.status = 404;
    throw error;
  }

  const evento = eventoRepository.findById(compra.eventoId);
  if (evento.organizadorId !== usuario.id) {
    const error = new Error(
      'Solo el organizador puede marcar la entrada como utilizada',
    );
    error.status = 403;
    throw error;
  }

  actualizarEstado(compra, EstadoCompra.UTILIZADA);
  compraRepository.update(compra);
  registrarCambio(compra.id, EstadoCompra.UTILIZADA, usuario.id);
  return enriquecerCompra(compra);
}

export function listarMisCompras(usuario) {
  return compraRepository.findByComprador(usuario.id).map(enriquecerCompra);
}

export function obtenerCompra(usuario, compraId) {
  const compra = compraRepository.findById(compraId);
  if (!compra) {
    const error = new Error('Compra no encontrada');
    error.status = 404;
    throw error;
  }
  const evento = eventoRepository.findById(compra.eventoId);
  const esComprador = compra.compradorId === usuario.id;
  const esOrganizador = evento?.organizadorId === usuario.id;
  if (!esComprador && !esOrganizador) {
    const error = new Error('No autorizado');
    error.status = 403;
    throw error;
  }
  return enriquecerCompra(compra);
}

export function listarComprasDeEvento(usuario, eventoId) {
  const evento = eventoRepository.findById(eventoId);
  if (!evento) {
    const error = new Error('Evento no encontrado');
    error.status = 404;
    throw error;
  }
  if (evento.organizadorId !== usuario.id) {
    const error = new Error(
      'Solo el organizador puede ver las compras del evento',
    );
    error.status = 403;
    throw error;
  }

  const compras = compraRepository.findByEvento(eventoId).map(enriquecerCompra);

  const porEstado = {
    PENDIENTE: 0,
    CONFIRMADA: 0,
    UTILIZADA: 0,
    CANCELADA: 0,
    REEMBOLSADA: 0,
  };
  compras.forEach((c) => {
    if (porEstado[c.estado] != null) porEstado[c.estado] += 1;
  });

  const porTipo = evento.tiposEntrada.map((t) => {
    let confirmadas = 0;
    let pendientes = 0;
    compras.forEach((c) => {
      const item = (c.items || []).find((i) => i.tipoEntradaId === t.id);
      if (!item) return;
      if (c.estado === EstadoCompra.CONFIRMADA) confirmadas += item.cantidad;
      if (c.estado === EstadoCompra.PENDIENTE) pendientes += item.cantidad;
      if (c.estado === EstadoCompra.UTILIZADA) confirmadas += item.cantidad;
    });
    return {
      id: t.id,
      nombre: t.nombre,
      precio: t.precio,
      confirmadas,
      pendientes,
      disponibles: t.cupo,
    };
  });

  const cupos = evento.tiposEntrada.map((t) => ({
    id: t.id,
    nombre: t.nombre,
    cupoDisponible: t.cupo,
    precio: t.precio,
  }));

  return {
    evento,
    compras,
    cupos,
    estadisticas: {
      porTipo,
      porEstado,
    },
  };
}
