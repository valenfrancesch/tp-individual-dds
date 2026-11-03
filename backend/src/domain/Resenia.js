export function crearResenia({
  id,
  compradorId,
  eventoId,
  organizadorId,
  detalle,
  puntuacion,
}) {
  return {
    id,
    compradorId,
    eventoId,
    organizadorId,
    detalle: detalle || '',
    puntuacion: Number(puntuacion),
  };
}
