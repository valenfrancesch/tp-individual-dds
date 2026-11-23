/**
 * Error de negocio/HTTP. El middleware de errores de app.js lo traduce a
 * `{ error: message }` con el status correspondiente.
 */
export class AppError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'AppError';
    this.status = status;
  }
}

export const badRequest = (message) => new AppError(400, message);
export const unauthorized = (message = 'No autenticado') =>
  new AppError(401, message);
export const forbidden = (message = 'No autorizado') =>
  new AppError(403, message);
export const notFound = (message = 'No encontrado') =>
  new AppError(404, message);
