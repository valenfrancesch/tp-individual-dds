export function crearTipoEntrada({ id, nombre, descripcion, precio, cupo }) {
  return {
    id,
    nombre,
    descripcion: descripcion || '',
    precio: Number(precio),
    cupo: Number(cupo),
  };
}

export function hayCupoPara(tipoEntrada, cantidad) {
  return Number(cantidad) > 0 && tipoEntrada.cupo >= Number(cantidad);
}
