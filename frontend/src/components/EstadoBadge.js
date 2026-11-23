import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ESTADOS } from '../utils/estados';

/** Estado con etiqueta legible + ícono: no depende solo del color. */
export default function EstadoBadge({ estado }) {
  const e = ESTADOS[estado] || { label: estado, color: '#374151', bg: '#e5e7eb', icon: 'ellipse-outline' };
  return (
    <View
      style={[styles.badge, { backgroundColor: e.bg, borderColor: e.color }]}
      accessible
      accessibilityLabel={`Estado: ${e.label}`}
    >
      <Ionicons name={e.icon} size={14} color={e.color} />
      <Text style={[styles.text, { color: e.color }]}>{e.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  text: { fontSize: 13, fontWeight: '700' },
});
