import React, { useState, createElement } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors, MIN_TOUCH, radius } from '../theme';
import { formatFechaDDMMYYYY, formatFechaLarga } from '../utils/format';

/** Convierte un ISO a "YYYY-MM-DDTHH:mm" en hora LOCAL (input datetime-local). */
function toLocalInput(iso) {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function DateTimeField({ label, value, onChange, error }) {
  // Android no soporta mode="datetime": se elige fecha y luego hora.
  const [modo, setModo] = useState(null);
  const date = value ? new Date(value) : new Date();

  if (Platform.OS === 'web') {
    return (
      <View style={styles.wrap}>
        {!!label && <Text style={styles.label}>{label}</Text>}
        {createElement('input', {
          type: 'datetime-local',
          value: value ? toLocalInput(value) : '',
          min: toLocalInput(new Date().toISOString()),
          'aria-label': label,
          'aria-invalid': !!error,
          onChange: (e) => {
            const d = new Date(e.target.value);
            if (!Number.isNaN(d.getTime())) onChange(d.toISOString());
          },
          style: {
            border: `${error ? 2 : 1}px solid ${error ? colors.danger : colors.border}`,
            borderRadius: 8,
            padding: 12,
            fontSize: 16,
            minHeight: MIN_TOUCH,
            width: '100%',
            boxSizing: 'border-box',
            fontFamily: 'inherit',
          },
        })}
        {!!error && <Text style={styles.error}>{error}</Text>}
      </View>
    );
  }

  const onPickerChange = (event, selected) => {
    if (event.type === 'dismissed' || !selected) {
      setModo(null);
      return;
    }
    if (Platform.OS === 'android' && modo === 'date') {
      const d = new Date(selected);
      d.setHours(date.getHours(), date.getMinutes(), 0, 0);
      onChange(d.toISOString());
      setModo('time');
      return;
    }
    onChange(selected.toISOString());
    if (Platform.OS === 'android') setModo(null);
  };

  return (
    <View style={styles.wrap}>
      {!!label && <Text style={styles.label}>{label}</Text>}
      <Pressable
        style={[styles.input, !!error && styles.inputError]}
        onPress={() => setModo(Platform.OS === 'ios' ? 'datetime' : 'date')}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${formatFechaLarga(value) || 'sin elegir'}`}
        accessibilityHint="Abre el selector de fecha y hora"
      >
        <Ionicons name="calendar-outline" size={18} color={colors.muted} />
        <Text style={styles.value}>{formatFechaDDMMYYYY(value, { withTime: true }) || 'Elegir fecha'}</Text>
      </Pressable>
      {!!error && <Text style={styles.error}>{error}</Text>}
      {!!modo && (
        <DateTimePicker
          value={date}
          mode={modo}
          minimumDate={new Date()}
          onChange={onPickerChange}
        />
      )}
      {Platform.OS === 'ios' && !!modo && (
        <Pressable onPress={() => setModo(null)} accessibilityRole="button" style={styles.listo}>
          <Text style={styles.listoText}>Listo</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 12 },
  label: { fontWeight: '600', marginBottom: 6, color: colors.text, fontSize: 15 },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: MIN_TOUCH,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#fff',
    borderRadius: radius.sm,
    paddingHorizontal: 12,
  },
  inputError: { borderColor: colors.danger, borderWidth: 2 },
  value: { color: colors.text, fontSize: 16 },
  error: { marginTop: 4, color: colors.danger, fontSize: 13, fontWeight: '600' },
  listo: { alignSelf: 'flex-end', minHeight: MIN_TOUCH, justifyContent: 'center', paddingHorizontal: 12 },
  listoText: { color: colors.primary, fontWeight: '700' },
});
