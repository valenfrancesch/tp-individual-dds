import React from 'react';
import { ScrollView, StyleSheet, View, Text, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme';
import StateView from './StateView';

/**
 * Contenedor de pantalla.
 * - `title`: solo en pantallas raíz de cada pestaña (las pantallas apiladas
 *   usan el header del navegador, así no hay dos títulos).
 * - `loading` / `error` + `onRetry`: estados de carga y error uniformes.
 * - `onRefresh` + `refreshing`: pull-to-refresh cuando `scroll` es true.
 */
export default function Screen({
  title,
  right,
  children,
  scroll = true,
  loading = false,
  error = null,
  onRetry,
  refreshing = false,
  onRefresh,
  edges,
}) {
  const Body = scroll ? ScrollView : View;
  const bodyProps = scroll
    ? {
        contentContainerStyle: styles.content,
        keyboardShouldPersistTaps: 'handled',
        refreshControl: onRefresh ? (
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        ) : undefined,
      }
    : {};

  let contenido;
  if (loading) contenido = <StateView loading />;
  else if (error) contenido = <StateView error={error} onRetry={onRetry} />;
  else contenido = (
    <Body style={styles.body} {...bodyProps}>
      {children}
    </Body>
  );

  return (
    <SafeAreaView style={styles.safe} edges={edges || (title ? ['top', 'left', 'right'] : ['left', 'right'])}>
      {!!title && (
        <View style={styles.header}>
          <Text style={styles.title} accessibilityRole="header" numberOfLines={2}>
            {title}
          </Text>
          {right}
        </View>
      )}
      {contenido}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: { fontSize: 22, fontWeight: '800', color: colors.text, flexShrink: 1 },
  body: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
});
