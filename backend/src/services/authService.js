import * as usuarioRepository from '../repositories/usuarioRepository.js';
import { usuarioPublico } from '../domain/Usuario.js';
import { signToken } from '../auth/jwt.js';
import { verifyPassword } from '../auth/password.js';

export async function login(email, password) {
  const usuario = usuarioRepository.findByEmail(email);
  const ok =
    usuario && (await verifyPassword(password, usuario.password));
  if (!ok) {
    const error = new Error('Credenciales inválidas');
    error.status = 401;
    throw error;
  }
  return {
    token: signToken(usuario.id),
    user: usuarioPublico(usuario),
  };
}

export function me(userId) {
  const usuario = usuarioRepository.findById(userId);
  if (!usuario) {
    const error = new Error('Usuario no encontrado');
    error.status = 401;
    throw error;
  }
  return usuarioPublico(usuario);
}

export function listSeedUsers() {
  return usuarioRepository.findAll().map((u) => ({
    id: u.id,
    nombre: u.nombre,
    apellido: u.apellido,
    email: u.email,
    roles: u.roles,
  }));
}

export function isSeedUsersEnabled() {
  if (process.env.ENABLE_SEED_USERS === 'true') return true;
  if (process.env.ENABLE_SEED_USERS === 'false') return false;
  return process.env.NODE_ENV !== 'production';
}
