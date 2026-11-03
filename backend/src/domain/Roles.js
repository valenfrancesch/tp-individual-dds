export const Roles = Object.freeze({
  COMPRADOR: 'COMPRADOR',
  ORGANIZADOR: 'ORGANIZADOR',
});

export function tieneRol(usuario, rol) {
  return Array.isArray(usuario?.roles) && usuario.roles.includes(rol);
}
