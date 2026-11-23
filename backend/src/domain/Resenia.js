import { badRequest } from '../errors/AppError.js';

export class Resenia {
  constructor({ id = null, comprador, evento, compra = null, detalle = '', puntuacion }) {
    const puntos = Number(puntuacion);
    if (!Number.isInteger(puntos) || puntos < 1 || puntos > 5) {
      throw badRequest('La puntuación debe ser un entero entre 1 y 5');
    }
    this.id = id;
    this.comprador = comprador;
    this.evento = evento;
    this.compra = compra;
    this.detalle = String(detalle ?? '').trim();
    this.puntuacion = puntos;
  }

  get organizador() {
    return this.evento.organizador;
  }
}
