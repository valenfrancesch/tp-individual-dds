export function crearCategoria({ id, nombre, descripcion, icono = 'pricetag' }) {
  return {
    id,
    nombre,
    descripcion: descripcion || '',
    icono,
  };
}
