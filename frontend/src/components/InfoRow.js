import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

/** Fila ícono + texto. El ícono es decorativo; `a11y` permite un texto más claro para lectores. */
export default function InfoRow({ icon, children, a11y, strong, color }) {
  return (
    <View style={styles.row} accessible accessibilityLabel={a11y || (typeof children === 'string' ? children : undefined)}>
      <Ionicons name={icon} size={16} color={color || colors.muted} />
      <Text style={[styles.text, strong && styles.strong, color && { color }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  text: { color: colors.muted, flexShrink: 1, fontSize: 14 },
  strong: { color: colors.text, fontWeight: '700' },
});
