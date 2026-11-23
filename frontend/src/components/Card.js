import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { colors, radius } from '../theme';

/** Tarjeta; si recibe onPress se comporta como botón accesible. */
export default function Card({ children, onPress, accessibilityLabel, accessibilityHint, style }) {
  if (!onPress) return <View style={[styles.card, style]}>{children}</View>;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [styles.card, pressed && styles.pressed, style]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  pressed: { backgroundColor: '#f1f5f9' },
});
