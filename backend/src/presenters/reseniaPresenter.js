import { usuarioResumen } from './usuarioPresenter.js';

export function reseniaJSON(resenia) {
  return {
    id: resenia.id,
    puntuacion: resenia.puntuacion,
    detalle: resenia.detalle,
    comprador: usuarioResumen(resenia.comprador),
    evento: {
      id: resenia.evento.id,
      nombre: resenia.evento.nombre,
      fecha: resenia.evento.fecha.toISOString(),
    },
  };
}
