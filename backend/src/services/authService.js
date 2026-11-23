import * as usuarioRepository from '../repositories/usuarioRepository.js';
import { signToken } from '../auth/jwt.js';
import { verifyPassword } from '../auth/password.js';
import { unauthorized } from '../errors/AppError.js';

export async function login(email, password) {
  const usuario = usuarioRepository.findByEmail(email);
  const ok = usuario && (await verifyPassword(password, usuario.passwordHash));
  if (!ok) throw unauthorized('Email o contraseña incorrectos');
  return { token: signToken(usuario.id), usuario };
}

export function listSeedUsers() {
  return usuarioRepository.findAll();
}

export function isSeedUsersEnabled() {
  if (process.env.ENABLE_SEED_USERS === 'true') return true;
  if (process.env.ENABLE_SEED_USERS === 'false') return false;
  return process.env.NODE_ENV !== 'production';
}
