import { useState } from 'react';
import { EventosApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { announce, notify } from '../utils/dialogs';

/** Toggle de favorito con actualización optimista del perfil. */
export default function useFavorito() {
  const { user, updateUser } = useAuth();
  const [pendiente, setPendiente] = useState(null);

  const esFavorito = (eventoId) => !!user?.favoritos?.includes(eventoId);

  const toggle = async (evento) => {
    if (pendiente) return;
    const activo = esFavorito(evento.id);
    const anterior = user;
    setPendiente(evento.id);
    updateUser({
      ...user,
      favoritos: activo
        ? user.favoritos.filter((id) => id !== evento.id)
        : [...user.favoritos, evento.id],
    });
    try {
      const perfil = activo
        ? await EventosApi.quitarFavorito(evento.id)
        : await EventosApi.agregarFavorito(evento.id);
      await updateUser(perfil);
      announce(activo ? `${evento.nombre} quitado de favoritos` : `${evento.nombre} agregado a favoritos`);
    } catch (error) {
      await updateUser(anterior);
      notify('No se pudo actualizar favoritos', error.message);
    } finally {
      setPendiente(null);
    }
  };

  return { esFavorito, toggle };
}
