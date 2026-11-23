import jwt from 'jsonwebtoken';
import { unauthorized } from '../errors/AppError.js';

const SECRET = process.env.JWT_SECRET || 'aiticketit-dev-secret';
const EXPIRES_IN = '8h';

export function signToken(userId) {
  return jwt.sign({ sub: userId }, SECRET, { expiresIn: EXPIRES_IN });
}

export function verifyToken(token) {
  let payload;
  try {
    payload = jwt.verify(token, SECRET);
  } catch (err) {
    throw unauthorized(err.name === 'TokenExpiredError' ? 'Sesión expirada' : 'Token inválido');
  }
  if (!payload?.sub) throw unauthorized('Token inválido');
  return { userId: payload.sub };
}
