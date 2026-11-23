import * as authService from '../services/authService.js';
import { usuarioPerfil } from '../presenters/usuarioPresenter.js';
import { notFound } from '../errors/AppError.js';

export async function login(req, res) {
  const { email, password } = req.body || {};
  const { token, usuario } = await authService.login(email, password);
  res.json({ token, user: usuarioPerfil(usuario) });
}

export function me(req, res) {
  res.json(usuarioPerfil(req.user));
}

export function seedUsers(_req, res) {
  if (!authService.isSeedUsersEnabled()) throw notFound();
  res.json(
    authService.listSeedUsers().map((u) => ({
      id: u.id,
      nombre: u.nombre,
      apellido: u.apellido,
      email: u.email,
      roles: u.roles,
    })),
  );
}
