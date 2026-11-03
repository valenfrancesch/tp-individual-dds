export function crearCambioEstadoCompra({
  id,
  compraId,
  estado,
  quienId,
  fechaHora = new Date().toISOString(),
}) {
  return {
    id,
    compraId,
    estado,
    quienId,
    fechaHora,
  };
}
