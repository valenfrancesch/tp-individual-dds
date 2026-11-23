import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

/**
 * Carga datos cada vez que la pantalla gana foco.
 * - `loading`: solo la primera carga (muestra spinner de pantalla completa).
 * - `refreshing`: recargas posteriores / pull-to-refresh (no tapa el contenido).
 * - `error`: mensaje para mostrar con botón "Reintentar".
 */
export default function useLoader(fetcher, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const loaded = useRef(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(async ({ pull = false } = {}) => {
    if (!loaded.current) setLoading(true);
    else if (pull) setRefreshing(true);
    try {
      const result = await fetcher();
      setData(result);
      setError(null);
      loaded.current = true;
      return result;
    } catch (e) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, deps);

  useFocusEffect(
    useCallback(() => {
      run();
    }, [run]),
  );

  return {
    data,
    setData,
    loading,
    refreshing,
    error,
    reload: run,
    refresh: () => run({ pull: true }),
  };
}
