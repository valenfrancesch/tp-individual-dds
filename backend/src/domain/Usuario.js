import { Roles } from './Roles.js';

export class Usuario {
  constructor({ id = null, nombre, apellido, email, passwordHash, roles = [] }) {
    this.id = id;
    this.nombre = nombre;
    this.apellido = apellido;
    this.email = email;
    this.passwordHash = passwordHash;
    this.roles = [...roles];
    /** @type {import('./Evento.js').Evento[]} */
    this.favoritos = [];
  }

  get nombreCompleto() {
    return `${this.nombre} ${this.apellido}`;
  }

  tieneRol(rol) {
    return this.roles.includes(rol);
  }

  esComprador() {
    return this.tieneRol(Roles.COMPRADOR);
  }

  esOrganizador() {
    return this.tieneRol(Roles.ORGANIZADOR);
  }

  esFavorito(evento) {
    return this.favoritos.includes(evento);
  }

  /** Idempotente: agregar dos veces no duplica. */
  agregarFavorito(evento) {
    if (!this.esFavorito(evento)) this.favoritos.push(evento);
  }

  /** Idempotente: quitar algo que no está no hace nada. */
  quitarFavorito(evento) {
    this.favoritos = this.favoritos.filter((e) => e !== evento);
  }

  es(otro) {
    return !!otro && otro.id === this.id;
  }
}
