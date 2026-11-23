import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, MIN_TOUCH, radius } from '../theme';

const VARIANTES = {
  primary: { bg: colors.primary, fg: '#fff', border: colors.primary },
  secondary: { bg: '#fff', fg: colors.primary, border: colors.primary },
  danger: { bg: colors.danger, fg: '#fff', border: colors.danger },
  ghost: { bg: 'transparent', fg: colors.primary, border: 'transparent' },
};

/**
 * Botón accesible: rol "button", estado disabled/busy anunciado y área ≥ 44px.
 * Mientras `busy` está activo se deshabilita para evitar doble envío.
 */
export default function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  busy = false,
  disabled = false,
  small = false,
  accessibilityLabel,
  accessibilityHint,
  style,
}) {
  const v = VARIANTES[variant];
  const inactivo = disabled || busy;
  return (
    <Pressable
      onPress={onPress}
      disabled={inactivo}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactivo, busy }}
      style={({ pressed }) => [
        styles.base,
        small && styles.small,
        { backgroundColor: v.bg, borderColor: v.border },
        pressed && !inactivo && styles.pressed,
        inactivo && styles.disabled,
        style,
      ]}
    >
      <View style={styles.row}>
        {busy ? (
          <ActivityIndicator size="small" color={v.fg} />
        ) : (
          !!icon && <Ionicons name={icon} size={small ? 16 : 18} color={v.fg} />
        )}
        <Text style={[styles.text, small && styles.textSmall, { color: v.fg }]}>{title}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: MIN_TOUCH,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  small: { paddingHorizontal: 12, paddingVertical: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  text: { fontWeight: '700', fontSize: 15 },
  textSmall: { fontSize: 14 },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.5 },
});
