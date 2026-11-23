import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, MIN_TOUCH } from '../theme';

/** Corazón de favorito: toggle accesible con estado "checked". */
export default function FavoritoButton({ activo, onPress, nombreEvento, style }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="switch"
      accessibilityLabel={`Favorito: ${nombreEvento}`}
      accessibilityState={{ checked: !!activo }}
      accessibilityHint={activo ? 'Quita el evento de tus favoritos' : 'Guarda el evento en tus favoritos'}
      hitSlop={6}
      style={({ pressed }) => [styles.btn, pressed && { opacity: 0.7 }, style]}
    >
      <Ionicons
        name={activo ? 'heart' : 'heart-outline'}
        size={24}
        color={activo ? colors.danger : colors.muted}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: MIN_TOUCH / 2,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
});
