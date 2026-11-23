import React from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import Screen from '../components/Screen';
import Card from '../components/Card';
import StarRating from '../components/StarRating';
import StateView from '../components/StateView';
import LogoutButton from '../components/LogoutButton';
import { ReseniasApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import useLoader from '../hooks/useLoader';
import { colors, radius } from '../theme';
import { formatFechaDDMMYYYY } from '../utils/format';

export default function ReseniasOrganizadorScreen() {
  const { hasRole } = useAuth();
  const { data, loading, error, reload, refresh, refreshing } = useLoader(() => ReseniasApi.recibidas(), []);
  const resenias = data || [];
  const promedio = resenias.length
    ? resenias.reduce((a, r) => a + r.puntuacion, 0) / resenias.length
    : null;

  return (
    <Screen title="Mis reseñas" scroll={false} right={hasRole('COMPRADOR') ? null : <LogoutButton />}>
      <FlatList
        data={error ? [] : resenias}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[colors.primary]} />}
        ListHeaderComponent={
          promedio != null ? (
            <View
              style={styles.resumen}
              accessible
              accessibilityLabel={`Puntaje promedio ${promedio.toFixed(1)} de 5, en ${resenias.length} reseñas`}
            >
              <Text style={styles.promedio}>{promedio.toFixed(1)}</Text>
              <View>
                <StarRating value={Math.round(promedio)} size={20} />
                <Text style={styles.meta}>{resenias.length} reseña(s)</Text>
              </View>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <Card>
            <StarRating value={item.puntuacion} size={18} />
            <Text style={styles.title}>{item.evento?.nombre}</Text>
            <Text style={styles.meta}>
              {item.comprador?.nombre} {item.comprador?.apellido} · {formatFechaDDMMYYYY(item.evento?.fecha)}
            </Text>
            {!!item.detalle && <Text style={styles.detalle}>{item.detalle}</Text>}
          </Card>
        )}
        ListEmptyComponent={
          loading ? (
            <StateView loading />
          ) : error ? (
            <StateView error={error} onRetry={reload} />
          ) : (
            <StateView icon="star-outline" empty="Todavía no recibiste reseñas" />
          )
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, paddingBottom: 32 },
  resumen: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  promedio: { fontSize: 40, fontWeight: '800', color: colors.text },
  title: { fontWeight: '800', fontSize: 16, color: colors.text, marginTop: 6 },
  meta: { color: colors.muted, marginTop: 2 },
  detalle: { marginTop: 6, color: colors.text },
});
