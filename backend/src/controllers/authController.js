import * as authService from '../services/authService.js';

function handleError(res, error) {
  const status = error.status || 500;
  return res.status(status).json({ error: error.message || 'Error interno' });
}

export async function login(req, res) {
  try {
    const { email, password } = req.body || {};
    const result = await authService.login(email, password);
    return res.json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export function me(req, res) {
  try {
    const user = authService.me(req.user.id);
    return res.json(user);
  } catch (error) {
    return handleError(res, error);
  }
}

export function seedUsers(req, res) {
  try {
    if (!authService.isSeedUsersEnabled()) {
      return res.status(404).json({ error: 'No encontrado' });
    }
    return res.json(authService.listSeedUsers());
  } catch (error) {
    return handleError(res, error);
  }
}
