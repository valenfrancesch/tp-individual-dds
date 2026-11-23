import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import Button from './Button';

/** Estados de carga, error (con reintentar) y vacío (con acción opcional). */
export default function StateView({
  loading,
  error,
  onRetry,
  empty,
  icon = 'file-tray-outline',
  actionLabel,
  onAction,
}) {
  if (loading) {
    return (
      <View style={styles.wrap} accessible accessibilityLabel="Cargando" accessibilityLiveRegion="polite">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.text}>Cargando…</Text>
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.wrap}>
        <Ionicons name="cloud-offline-outline" size={40} color={colors.danger} />
        <Text style={styles.text} accessibilityRole="alert" accessibilityLiveRegion="assertive">
          {error}
        </Text>
        {!!onRetry && <Button title="Reintentar" icon="refresh" onPress={onRetry} />}
      </View>
    );
  }
  return (
    <View style={styles.wrap}>
      <Ionicons name={icon} size={40} color={colors.muted} />
      <Text style={styles.text}>{empty}</Text>
      {!!onAction && <Button title={actionLabel} variant="secondary" onPress={onAction} />}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12, minHeight: 200 },
  text: { color: colors.muted, textAlign: 'center', fontSize: 15 },
});
