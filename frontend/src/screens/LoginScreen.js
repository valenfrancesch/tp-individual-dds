import React, { useEffect, useRef, useState } from 'react';
import { Text, Pressable, StyleSheet, View, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Field from '../components/Field';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { AuthApi } from '../api/client';
import { colors, MIN_TOUCH, radius } from '../theme';

/** Prefill local solo en desarrollo (no viene del API). */
const DEV_PASSWORDS = {
  'ana@ticket.it': 'ana123',
  'luis@ticket.it': 'luis123',
  'maria@ticket.it': 'maria123',
};

export default function LoginScreen() {
  const { login, sessionMessage } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [seedUsers, setSeedUsers] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(sessionMessage);
  const passwordRef = useRef(null);

  useEffect(() => {
    AuthApi.seedUsers().then(setSeedUsers).catch(() => setSeedUsers([]));
  }, []);

  const onLogin = async () => {
    if (!email.trim() || !password) {
      setError('Completá email y contraseña');
      return;
    }
    try {
      setBusy(true);
      setError(null);
      await login(email.trim(), password);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const selectSeed = (u) => {
    setEmail(u.email);
    setPassword(__DEV__ ? DEV_PASSWORDS[u.email] || '' : '');
    setError(null);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen title="AI Ticket It">
        <Text style={styles.subtitle}>Ingresá para comprar u organizar eventos</Text>

        {!!error && (
          <View style={styles.errorBox} accessibilityRole="alert" accessibilityLiveRegion="assertive">
            <Ionicons name="alert-circle" size={18} color={colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <Field
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          autoComplete="email"
          textContentType="username"
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
          placeholder="tu@email.com"
        />
        <Field
          ref={passwordRef}
          label="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!mostrarPassword}
          autoComplete="password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={onLogin}
          right={
            <Pressable
              onPress={() => setMostrarPassword((v) => !v)}
              accessibilityRole="button"
              accessibilityLabel={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              style={styles.eye}
            >
              <Ionicons name={mostrarPassword ? 'eye-off-outline' : 'eye-outline'} size={22} color={colors.muted} />
            </Pressable>
          }
        />

        <Button title="Entrar" icon="log-in-outline" onPress={onLogin} busy={busy} />

        {!!seedUsers.length && (
          <>
            <Text style={styles.section} accessibilityRole="header">
              Usuarios de prueba
            </Text>
            <Text style={styles.hint}>
              Tocá uno para completar el email{__DEV__ ? ' y la contraseña' : ''}.
            </Text>
            {seedUsers.map((u) => (
              <Pressable
                key={u.id}
                style={({ pressed }) => [styles.userCard, email === u.email && styles.userCardActive, pressed && { opacity: 0.8 }]}
                onPress={() => selectSeed(u)}
                accessibilityRole="button"
                accessibilityLabel={`Usar ${u.nombre} ${u.apellido}, roles ${u.roles.join(' y ').toLowerCase()}`}
                accessibilityState={{ selected: email === u.email }}
              >
                <Text style={styles.userName}>
                  {u.nombre} {u.apellido}
                </Text>
                <Text style={styles.userMeta}>
                  {u.email} · {u.roles.join(', ')}
                </Text>
              </Pressable>
            ))}
          </>
        )}
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  subtitle: { color: colors.muted, marginBottom: 16, fontSize: 15 },
  errorBox: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.sm,
    padding: 12,
    marginBottom: 12,
  },
  errorText: { color: colors.danger, fontWeight: '600', flexShrink: 1 },
  eye: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: { marginTop: 28, fontWeight: '800', fontSize: 17, color: colors.text },
  hint: { color: colors.muted, marginBottom: 8, marginTop: 4 },
  userCard: {
    backgroundColor: '#fff',
    borderRadius: radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
    minHeight: MIN_TOUCH,
  },
  userCardActive: { borderColor: colors.primary, borderWidth: 2 },
  userName: { fontWeight: '700', color: colors.text, fontSize: 15 },
  userMeta: { color: colors.muted, marginTop: 2 },
});
