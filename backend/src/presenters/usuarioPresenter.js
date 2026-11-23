/** Datos mínimos para mostrar a otra persona (sin email ni password). */
export function usuarioResumen(usuario) {
  if (!usuario) return null;
  return { id: usuario.id, nombre: usuario.nombre, apellido: usuario.apellido };
}

/** Perfil del usuario autenticado (nunca incluye el hash). */
export function usuarioPerfil(usuario) {
  return {
    ...usuarioResumen(usuario),
    email: usuario.email,
    roles: [...usuario.roles],
    favoritos: usuario.favoritos.map((e) => e.id),
  };
}
