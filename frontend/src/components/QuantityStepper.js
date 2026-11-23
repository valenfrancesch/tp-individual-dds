import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, MIN_TOUCH } from '../theme';

/** Selector de cantidad accesible (rol "adjustable" + botones de 44px). */
export default function QuantityStepper({ value, min = 1, max, onChange, label = 'Cantidad' }) {
  const puedeBajar = value > min;
  const puedeSubir = max == null || value < max;
  const cambiar = (delta) => {
    const next = value + delta;
    if (next < min || (max != null && next > max)) return;
    onChange(next);
  };

  return (
    <View
      style={styles.row}
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ min, max, now: value, text: `${value}` }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => cambiar(e.nativeEvent.actionName === 'increment' ? 1 : -1)}
    >
      <Pressable
        onPress={() => cambiar(-1)}
        disabled={!puedeBajar}
        accessibilityRole="button"
        accessibilityLabel="Quitar una entrada"
        accessibilityState={{ disabled: !puedeBajar }}
        style={[styles.btn, !puedeBajar && styles.disabled]}
      >
        <Ionicons name="remove" size={22} color="#fff" />
      </Pressable>
      <Text style={styles.value} accessibilityElementsHidden importantForAccessibility="no">
        {value}
      </Text>
      <Pressable
        onPress={() => cambiar(1)}
        disabled={!puedeSubir}
        accessibilityRole="button"
        accessibilityLabel="Agregar una entrada"
        accessibilityState={{ disabled: !puedeSubir }}
        style={[styles.btn, !puedeSubir && styles.disabled]}
      >
        <Ionicons name="add" size={22} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  btn: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    borderRadius: MIN_TOUCH / 2,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.4 },
  value: { minWidth: 32, textAlign: 'center', fontSize: 20, fontWeight: '800', color: colors.text },
});
