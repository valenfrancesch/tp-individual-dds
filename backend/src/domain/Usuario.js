export function crearUsuario({
  id,
  nombre,
  apellido,
  email,
  password,
  roles = [],
  favoritos = [],
}) {
  return {
    id,
    nombre,
    apellido,
    email,
    password,
    roles,
    favoritos: [...favoritos],
  };
}

export function usuarioPublico(usuario) {
  if (!usuario) return null;
  const { password, ...rest } = usuario;
  return rest;
}
