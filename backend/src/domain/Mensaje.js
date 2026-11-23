import { badRequest } from '../errors/AppError.js';

export class Mensaje {
  constructor({ id = null, usuario, mensaje, enviado = new Date() }) {
    const texto = String(mensaje ?? '').trim();
    if (!texto) throw badRequest('El mensaje no puede estar vacío');
    if (texto.length > 1000) throw badRequest('El mensaje es demasiado largo (máx. 1000)');
    this.id = id;
    this.usuario = usuario;
    this.mensaje = texto;
    this.enviado = new Date(enviado);
  }
}
