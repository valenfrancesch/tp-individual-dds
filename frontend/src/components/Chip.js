import React from 'react';
import { Pressable, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, MIN_TOUCH, radius } from '../theme';

/** Chip seleccionable (filtros). Anuncia su estado "seleccionado". */
export default function Chip({ label, selected, onPress, icon, accessibilityLabel, accessibilityHint }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ selected: !!selected }}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.selected,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.inner}>
        {selected ? (
          <Ionicons name="checkmark" size={14} color={colors.primaryDark} />
        ) : (
          !!icon && <Ionicons name={icon} size={14} color={colors.text} />
        )}
        <Text style={[styles.text, selected && styles.textSelected]}>{label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: MIN_TOUCH - 8,
    paddingHorizontal: 12,
    justifyContent: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#fff',
  },
  selected: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  pressed: { opacity: 0.8 },
  inner: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  text: { fontSize: 14, fontWeight: '600', color: colors.text },
  textSelected: { color: colors.primaryDark },
});
