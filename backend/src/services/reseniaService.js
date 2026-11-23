import * as reseniaRepository from '../repositories/reseniaRepository.js';
import { forbidden } from '../errors/AppError.js';

export function reseniasRecibidas(usuario) {
  if (!usuario.esOrganizador()) throw forbidden('Se requiere rol ORGANIZADOR');
  return reseniaRepository.findByOrganizador(usuario);
}
