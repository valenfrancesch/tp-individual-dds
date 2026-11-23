import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { colors, MIN_TOUCH, radius } from '../theme';

/**
 * Input con label visible, error inline y nombre accesible.
 * El error se anuncia (live region) y se agrega al label del input.
 */
export default function Field({ label, error, hint, style, inputStyle, right, ...inputProps }) {
  const a11yLabel = [label, error ? `Error: ${error}` : null].filter(Boolean).join('. ');
  return (
    <View style={[styles.wrap, style]}>
      {!!label && (
        <Text style={styles.label} nativeID={inputProps.nativeID ? `${inputProps.nativeID}-label` : undefined}>
          {label}
        </Text>
      )}
      <View style={styles.inputRow}>
        <TextInput
          placeholderTextColor={colors.muted}
          accessibilityLabel={a11yLabel}
          accessibilityHint={hint}
          style={[styles.input, !!error && styles.inputError, inputStyle]}
          {...inputProps}
        />
        {right}
      </View>
      {!!hint && !error && <Text style={styles.hint}>{hint}</Text>}
      {!!error && (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 12 },
  label: { fontWeight: '600', marginBottom: 6, color: colors.text, fontSize: 15 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  input: {
    flex: 1,
    minHeight: MIN_TOUCH,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#fff',
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.text,
  },
  inputError: { borderColor: colors.danger, borderWidth: 2 },
  hint: { marginTop: 4, color: colors.muted, fontSize: 13 },
  error: { marginTop: 4, color: colors.danger, fontSize: 13, fontWeight: '600' },
});
