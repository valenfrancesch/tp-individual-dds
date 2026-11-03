export function crearMensaje({ id, usuarioId, mensaje, enviado = new Date().toISOString() }) {
  return {
    id,
    usuarioId,
    mensaje,
    enviado,
  };
}
