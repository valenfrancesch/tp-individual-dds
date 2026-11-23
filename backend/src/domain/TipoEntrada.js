import { badRequest } from '../errors/AppError.js';

function esEnteroPositivo(n) {
  return Number.isInteger(n) && n > 0;
}

export class TipoEntrada {
  constructor({ id = null, nombre, descripcion = '', precio, cupo }) {
    const precioNum = Number(precio);
    const cupoNum = Number(cupo);
    if (!String(nombre ?? '').trim()) {
      throw badRequest('Cada tipo de entrada necesita un nombre');
    }
    if (!Number.isFinite(precioNum) || precioNum <= 0) {
      throw badRequest(`El precio de "${nombre}" debe ser mayor a 0`);
    }
    if (!Number.isInteger(cupoNum) || cupoNum < 0) {
      throw badRequest(`El cupo de "${nombre}" debe ser un entero mayor o igual a 0`);
    }
    this.id = id;
    this.nombre = String(nombre).trim();
    this.descripcion = descripcion || '';
    this.precio = precioNum;
    this.cupo = cupoNum;
  }

  hayCupoPara(cantidad) {
    return esEnteroPositivo(cantidad) && this.cupo >= cantidad;
  }

  reservar(cantidad) {
    if (!esEnteroPositivo(cantidad)) {
      throw badRequest('La cantidad debe ser un entero mayor a 0');
    }
    if (!this.hayCupoPara(cantidad)) {
      throw badRequest(
        `No hay cupo suficiente para ${this.nombre} (pedido: ${cantidad}, disponible: ${this.cupo})`,
      );
    }
    this.cupo -= cantidad;
  }

  liberar(cantidad) {
    this.cupo += cantidad;
  }

  precioPor(cantidad) {
    return this.precio * cantidad;
  }
}
