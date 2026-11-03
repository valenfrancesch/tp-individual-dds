import * as usuarioRepository from '../repositories/usuarioRepository.js';
import { verifyToken } from '../auth/jwt.js';

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Token requerido' });
  }

  try {
    const { userId } = verifyToken(token);
    const usuario = usuarioRepository.findById(userId);
    if (!usuario) {
      return res.status(401).json({ error: 'Token inválido' });
    }
    req.user = usuario;
    return next();
  } catch (error) {
    return res.status(error.status || 401).json({
      error: error.message || 'Token inválido',
    });
  }
}
