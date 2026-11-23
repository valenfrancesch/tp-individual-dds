import { badRequest, forbidden } from '../errors/AppError.js';
import { EstadoCompra, puedeTransicionar } from './EstadoCompra.js';
import { CambioEstadoCompra } from './CambioEstadoCompra.js';
import { Mensaje } from './Mensaje.js';
import { Resenia } from './Resenia.js';

/** Acciones que un usuario puede ejecutar sobre una compra (para la UI). */
export const AccionCompra = Object.freeze({
  PAGAR: 'pagar',
  CANCELAR: 'cancelar',
  UTILIZAR: 'utilizar',
  REEMBOLSAR: 'reembolsar',
  RESENIAR: 'reseniar',
});

export class Compra {
  constructor({
    id = null,
    comprador,
    evento,
    tipoEntrada,
    cantidad,
    fecha = new Date(),
  }) {
    this.id = id;
    this.comprador = comprador;
    this.evento = evento;
    this.tipoEntrada = tipoEntrada;
    this.cantidad = cantidad;
    this.total = tipoEntrada.precioPor(cantidad);
    this.fecha = new Date(fecha);
    this.estado = EstadoCompra.PENDIENTE;
    /** @type {Mensaje[]} */
    this.mensajes = [];
    /** @type {CambioEstadoCompra[]} */
    this.historial = [];
    /** @type {Resenia|null} */
    this.resenia = null;
  }

  /**
   * Crea una compra PENDIENTE y reserva el cupo, así dos compras pendientes
   * no pueden vender la misma entrada.
   */
  static crear({ comprador, evento, tipoEntradaId, cantidad }, ahora = new Date()) {
    if (!comprador.esComprador()) throw forbidden('Se requiere rol COMPRADOR');
    if (evento.esOrganizadoPor(comprador)) {
      throw badRequest('No podés comprar entradas de tu propio evento');
    }
    if (evento.yaSeRealizo(ahora)) throw badRequest('El evento ya se realizó');
    const tipoEntrada = evento.tipoEntrada(tipoEntradaId);
    if (!tipoEntrada) throw badRequest('Tipo de entrada no encontrado en este evento');
    const qty = Number(cantidad);
    tipoEntrada.reservar(qty);

    const compra = new Compra({ comprador, evento, tipoEntrada, cantidad: qty, fecha: ahora });
    compra.#registrarCambio(EstadoCompra.PENDIENTE, comprador, ahora);
    return compra;
  }

  // ---- Consultas -------------------------------------------------------

  esDelComprador(usuario) {
    return !!usuario && this.comprador.id === usuario.id;
  }

  esDelOrganizador(usuario) {
    return this.evento.esOrganizadoPor(usuario);
  }

  esParticipante(usuario) {
    return this.esDelComprador(usuario) || this.esDelOrganizador(usuario);
  }

  fuePagada() {
    return this.historial.some((c) => c.estado === EstadoCompra.CONFIRMADA);
  }

  /** Días hasta el evento; solo tiene sentido para compras confirmadas. */
  diasHastaEvento(ahora = new Date()) {
    if (this.estado !== EstadoCompra.CONFIRMADA) return null;
    return this.evento.diasHasta(ahora);
  }

  /** Lista de acciones válidas para `usuario` ahora mismo. */
  accionesPara(usuario, ahora = new Date()) {
    const validadores = {
      [AccionCompra.PAGAR]: () => this.#validarPago(usuario, ahora),
      [AccionCompra.CANCELAR]: () => this.#validarCancelacion(usuario, ahora),
      [AccionCompra.UTILIZAR]: () => this.#validarUso(usuario, ahora),
      [AccionCompra.REEMBOLSAR]: () => this.#validarReembolso(usuario),
      [AccionCompra.RESENIAR]: () => this.#validarResenia(usuario, ahora),
    };
    return Object.entries(validadores)
      .filter(([, validar]) => {
        try {
          validar();
          return true;
        } catch {
          return false;
        }
      })
      .map(([accion]) => accion);
  }

  // ---- Comandos --------------------------------------------------------

  pagar(quien, ahora = new Date()) {
    this.#validarPago(quien, ahora);
    this.#actualizarEstado(EstadoCompra.CONFIRMADA, quien, ahora);
  }

  cancelar(quien, ahora = new Date()) {
    this.#validarCancelacion(quien, ahora);
    this.#actualizarEstado(EstadoCompra.CANCELADA, quien, ahora);
    this.tipoEntrada.liberar(this.cantidad);
  }

  marcarReembolsada(quien, ahora = new Date()) {
    this.#validarReembolso(quien);
    this.#actualizarEstado(EstadoCompra.REEMBOLSADA, quien, ahora);
  }

  utilizar(quien, ahora = new Date()) {
    this.#validarUso(quien, ahora);
    this.#actualizarEstado(EstadoCompra.UTILIZADA, quien, ahora);
  }

  agregarMensaje(usuario, texto, ahora = new Date()) {
    if (!this.esParticipante(usuario)) {
      throw forbidden('No participás de esta compra');
    }
    const mensaje = new Mensaje({ usuario, mensaje: texto, enviado: ahora });
    mensaje.id = `${this.id}-msg-${this.mensajes.length + 1}`;
    this.mensajes.push(mensaje);
    return mensaje;
  }

  reseniar(usuario, { detalle, puntuacion }, ahora = new Date()) {
    this.#validarResenia(usuario, ahora);
    this.resenia = new Resenia({
      comprador: usuario,
      evento: this.evento,
      compra: this,
      detalle,
      puntuacion,
    });
    return this.resenia;
  }

  // ---- Reglas ----------------------------------------------------------

  #validarTransicion(hacia) {
    if (!puedeTransicionar(this.estado, hacia)) {
      throw badRequest(`No se puede pasar de ${this.estado} a ${hacia}`);
    }
  }

  #validarPago(quien, ahora) {
    if (!this.esDelComprador(quien)) throw forbidden('Solo el comprador puede pagar');
    this.#validarTransicion(EstadoCompra.CONFIRMADA);
    if (this.evento.yaSeRealizo(ahora)) throw badRequest('El evento ya se realizó');
  }

  #validarCancelacion(quien, ahora) {
    if (!this.esParticipante(quien)) throw forbidden('No participás de esta compra');
    if (this.estado === EstadoCompra.UTILIZADA) {
      throw badRequest('No se puede cancelar una entrada ya utilizada');
    }
    if (this.evento.yaSeRealizo(ahora)) {
      throw badRequest('No se puede cancelar: el evento ya se realizó');
    }
    this.#validarTransicion(EstadoCompra.CANCELADA);
  }

  #validarReembolso(quien) {
    if (!this.esDelOrganizador(quien)) {
      throw forbidden('Solo el organizador puede registrar el reembolso');
    }
    this.#validarTransicion(EstadoCompra.REEMBOLSADA);
    if (!this.fuePagada()) {
      throw badRequest('La compra nunca se pagó: no hay nada que reembolsar');
    }
  }

  #validarUso(quien, ahora) {
    if (!this.esDelOrganizador(quien)) {
      throw forbidden('Solo el organizador puede marcar la entrada como utilizada');
    }
    this.#validarTransicion(EstadoCompra.UTILIZADA);
    if (!this.evento.esElDiaOPosterior(ahora)) {
      throw badRequest('La entrada solo se puede marcar como utilizada desde el día del evento');
    }
  }

  #validarResenia(usuario, ahora) {
    if (!this.esDelComprador(usuario)) throw forbidden('Solo el comprador puede reseñar');
    if (this.estado !== EstadoCompra.UTILIZADA) {
      throw badRequest('Solo se puede reseñar una entrada utilizada');
    }
    if (!this.evento.yaSeRealizo(ahora)) {
      throw badRequest('Podés reseñar una vez que el evento haya comenzado');
    }
    if (this.resenia) throw badRequest('Ya reseñaste esta compra');
  }

  #actualizarEstado(nuevoEstado, quien, ahora) {
    this.#validarTransicion(nuevoEstado);
    this.estado = nuevoEstado;
    this.#registrarCambio(nuevoEstado, quien, ahora);
  }

  #registrarCambio(estado, quien, ahora) {
    this.historial.push(new CambioEstadoCompra({ compra: this, estado, quien, fechaHora: ahora }));
  }
}
