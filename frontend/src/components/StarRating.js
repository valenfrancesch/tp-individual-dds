import React from 'react';
import { View, Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, MIN_TOUCH } from '../theme';

/**
 * Puntaje 1–5 con estrellas.
 * - Editable: cada estrella es un botón ("Puntuar 3 de 5") y el grupo es
 *   "adjustable", así VoiceOver/TalkBack permiten subir/bajar con gestos.
 * - Solo lectura: se lee como "Puntaje 4 de 5".
 */
export default function StarRating({ value = 0, onChange, size = 28, label = 'Puntaje' }) {
  const editable = !!onChange;
  const estrellas = [1, 2, 3, 4, 5];

  if (!editable) {
    return (
      <View style={styles.row} accessible accessibilityLabel={`${label} ${value} de 5`}>
        {estrellas.map((n) => (
          <Ionicons
            key={n}
            name={n <= value ? 'star' : 'star-outline'}
            size={size}
            color={colors.star}
          />
        ))}
      </View>
    );
  }

  return (
    <View>
      <View
        style={styles.row}
        accessibilityRole="adjustable"
        accessibilityLabel={label}
        accessibilityValue={{ min: 1, max: 5, now: value, text: `${value} de 5` }}
        onAccessibilityAction={(e) => {
          if (e.nativeEvent.actionName === 'increment') onChange(Math.min(5, value + 1));
          if (e.nativeEvent.actionName === 'decrement') onChange(Math.max(1, value - 1));
        }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      >
        {estrellas.map((n) => (
          <Pressable
            key={n}
            onPress={() => onChange(n)}
            accessibilityRole="button"
            accessibilityLabel={`Puntuar ${n} de 5`}
            accessibilityState={{ selected: n === value }}
            style={styles.star}
            hitSlop={4}
          >
            <Ionicons name={n <= value ? 'star' : 'star-outline'} size={size} color={colors.star} />
          </Pressable>
        ))}
      </View>
      <Text style={styles.hint}>{value ? `${value} de 5` : 'Elegí un puntaje'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  star: { minWidth: MIN_TOUCH, minHeight: MIN_TOUCH, alignItems: 'center', justifyContent: 'center' },
  hint: { color: colors.muted, marginTop: 2 },
});
