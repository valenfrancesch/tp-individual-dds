import { Platform } from 'react-native';
import Constants from 'expo-constants';

const PORT = 3001;

/**
 * Resuelve la URL del backend sin tener que editar código:
 * 1. EXPO_PUBLIC_API_URL si está definida (ej. en un .env).
 * 2. En Expo Go (celular físico o emulador), la IP de la PC que sirve el bundle
 *    (`hostUri`, ej. "192.168.0.10:8081") → http://192.168.0.10:3001.
 * 3. Fallback: 10.0.2.2 en emulador Android, localhost en el resto (web/iOS sim).
 */
function resolverApiUrl() {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;

  if (Platform.OS !== 'web') {
    const hostUri = Constants.expoConfig?.hostUri;
    const host = hostUri?.split(':')[0];
    if (host) return `http://${host}:${PORT}`;
  }

  const host = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
  return `http://${host}:${PORT}`;
}

export const API_URL = resolverApiUrl();
