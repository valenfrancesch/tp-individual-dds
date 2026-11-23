import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthApi, setAuthToken, setOnUnauthorized } from '../api/client';
import { announce } from '../utils/dialogs';

const AuthContext = createContext(null);
const STORAGE_KEY = 'aiticketit.auth.v3';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionMessage, setSessionMessage] = useState(null);

  const persist = async (t, u) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ token: t, user: u }));
    } catch {
      // Si el storage falla, la sesión igual funciona hasta cerrar la app.
    }
  };

  const clearSession = useCallback(async (message = null) => {
    setAuthToken(null);
    setToken(null);
    setUser(null);
    setSessionMessage(message);
    if (message) announce(message);
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignorar
    }
  }, []);

  useEffect(() => {
    setOnUnauthorized(() => clearSession('Tu sesión expiró. Ingresá de nuevo.'));
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        const saved = raw ? JSON.parse(raw) : null;
        if (!saved?.token) return;
        setAuthToken(saved.token);
        const me = await AuthApi.me();
        setToken(saved.token);
        setUser(me);
        await persist(saved.token, me);
      } catch {
        await clearSession();
      } finally {
        setLoading(false);
      }
    })();
  }, [clearSession]);

  const login = async (email, password) => {
    const result = await AuthApi.login(email, password);
    setAuthToken(result.token);
    setToken(result.token);
    setUser(result.user);
    setSessionMessage(null);
    await persist(result.token, result.user);
    return result.user;
  };

  /** Reemplaza el perfil con lo que devolvió el backend (ej. tras tocar favoritos). */
  const updateUser = async (perfil) => {
    setUser(perfil);
    await persist(token, perfil);
  };

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      sessionMessage,
      login,
      logout: () => clearSession(),
      updateUser,
      hasRole: (role) => !!user?.roles?.includes(role),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, token, loading, sessionMessage],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
