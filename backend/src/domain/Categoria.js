export class Categoria {
  constructor({ id = null, nombre, descripcion = '', icono = 'pricetag' }) {
    this.id = id;
    this.nombre = nombre;
    this.descripcion = descripcion;
    this.icono = icono;
  }
}
