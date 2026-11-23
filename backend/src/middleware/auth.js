import * as usuarioRepository from '../repositories/usuarioRepository.js';
import { verifyToken } from '../auth/jwt.js';
import { forbidden, unauthorized } from '../errors/AppError.js';

export function requireAuth(req, _res, next) {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) throw unauthorized('Token requerido');

  const { userId } = verifyToken(token);
  const usuario = usuarioRepository.findById(userId);
  if (!usuario) throw unauthorized('Token inválido');
  req.user = usuario;
  next();
}

export function requireRole(rol) {
  return (req, _res, next) => {
    if (!req.user?.tieneRol(rol)) throw forbidden(`Se requiere rol ${rol}`);
    next();
  };
}
