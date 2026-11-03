export function crearEvento({
  id,
  nombre,
  descripcion,
  categoriaId,
  fecha,
  direccion = '',
  tiposEntrada = [],
  multimedia = [],
  organizadorId,
}) {
  return {
    id,
    nombre,
    descripcion: descripcion || '',
    categoriaId,
    fecha,
    direccion: direccion || '',
    tiposEntrada,
    multimedia: [...multimedia],
    organizadorId,
  };
}

export function precioMinimo(evento) {
  if (!evento.tiposEntrada?.length) return 0;
  return Math.min(...evento.tiposEntrada.map((t) => t.precio));
}

export function tuPrecioEstaEntre(evento, min, max) {
  const precio = precioMinimo(evento);
  return precio >= Number(min) && precio <= Number(max);
}
