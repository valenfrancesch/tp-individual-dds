import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'aiticketit-dev-secret';
const EXPIRES_IN = '8h';

export function signToken(userId) {
  return jwt.sign({ sub: userId }, SECRET, { expiresIn: EXPIRES_IN });
}

export function verifyToken(token) {
  try {
    const payload = jwt.verify(token, SECRET);
    const userId = payload.sub;
    if (!userId) {
      const error = new Error('Token inválido');
      error.status = 401;
      throw error;
    }
    return { userId };
  } catch (err) {
    if (err.status === 401) throw err;
    const error = new Error(
      err.name === 'TokenExpiredError' ? 'Token expirado' : 'Token inválido',
    );
    error.status = 401;
    throw error;
  }
}
