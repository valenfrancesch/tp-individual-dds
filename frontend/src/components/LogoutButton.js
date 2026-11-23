import React from 'react';
import { Pressable, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { confirm } from '../utils/dialogs';
import { colors, MIN_TOUCH } from '../theme';

export default function LogoutButton() {
  const { logout } = useAuth();
  const onPress = async () => {
    const ok = await confirm({
      title: 'Cerrar sesión',
      message: '¿Querés salir de tu cuenta?',
      confirmText: 'Salir',
    });
    if (ok) logout();
  };
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Cerrar sesión"
      style={styles.btn}
      hitSlop={6}
    >
      <View style={styles.row}>
        <Ionicons name="log-out-outline" size={20} color={colors.danger} />
        <Text style={styles.text}>Salir</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { minHeight: MIN_TOUCH, justifyContent: 'center', paddingHorizontal: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  text: { color: colors.danger, fontWeight: '700', fontSize: 15 },
});
