import { usuarioResumen } from './usuarioPresenter.js';
import { eventoResumen } from './eventoPresenter.js';
import { reseniaJSON } from './reseniaPresenter.js';

export function mensajeJSON(mensaje) {
  return {
    id: mensaje.id,
    mensaje: mensaje.mensaje,
    enviado: mensaje.enviado.toISOString(),
    usuario: usuarioResumen(mensaje.usuario),
  };
}

export function compraJSON(compra, usuario, ahora = new Date()) {
  const comprador = usuarioResumen(compra.comprador);
  // El organizador ve el email para poder contactar al comprador.
  if (compra.esDelOrganizador(usuario)) comprador.email = compra.comprador.email;

  return {
    id: compra.id,
    estado: compra.estado,
    fecha: compra.fecha.toISOString(),
    cantidad: compra.cantidad,
    total: compra.total,
    tipoEntrada: {
      id: compra.tipoEntrada.id,
      nombre: compra.tipoEntrada.nombre,
      precio: compra.tipoEntrada.precio,
    },
    evento: eventoResumen(compra.evento),
    comprador,
    diasRestantes: compra.diasHastaEvento(ahora),
    fuePagada: compra.fuePagada(),
    acciones: compra.accionesPara(usuario, ahora),
    cantidadMensajes: compra.mensajes.length,
    resenia: compra.resenia ? reseniaJSON(compra.resenia) : null,
  };
}

export function compraDetalleJSON(compra, usuario, ahora = new Date()) {
  return {
    ...compraJSON(compra, usuario, ahora),
    historial: compra.historial.map((c) => ({
      estado: c.estado,
      fechaHora: c.fechaHora.toISOString(),
      quien: usuarioResumen(c.quien),
    })),
  };
}
