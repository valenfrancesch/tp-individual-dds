import React from 'react';
import { Text, StyleSheet, FlatList, View, Image, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Card from '../components/Card';
import Button from '../components/Button';
import StateView from '../components/StateView';
import InfoRow from '../components/InfoRow';
import LogoutButton from '../components/LogoutButton';
import { EventosApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import useLoader from '../hooks/useLoader';
import { colors, radius } from '../theme';
import { formatFechaDDMMYYYY, formatFechaLarga, labelPuntaje, a11yPuntaje } from '../utils/format';

export default function MisEventosScreen({ navigation }) {
  const { user, hasRole } = useAuth();
  const { data, loading, error, reload, refresh, refreshing } = useLoader(() => EventosApi.mios(), []);
  const eventos = data || [];
  const proximos = eventos.filter((e) => !e.yaSeRealizo).length;

  return (
    <Screen
      title="Mis eventos"
      scroll={false}
      right={hasRole('COMPRADOR') ? null : <LogoutButton />}
    >
      <FlatList
        data={error ? [] : eventos}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[colors.primary]} />}
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            <Text style={styles.hello}>
              Hola, {user?.nombre}. Tenés {proximos} evento(s) próximos.
            </Text>
            <Button
              title="Crear evento"
              icon="add-circle-outline"
              onPress={() => navigation.navigate('CrearEvento')}
            />
          </View>
        }
        renderItem={({ item }) => (
          <Card
            onPress={() => navigation.navigate('EventoCompras', { eventoId: item.id })}
            accessibilityLabel={[
              item.nombre,
              formatFechaLarga(item.fecha),
              item.yaSeRealizo ? 'finalizado' : null,
              `${item.cupoDisponible} entradas disponibles`,
              a11yPuntaje(item.puntajeOrganizador, item.cantidadResenias),
            ]
              .filter(Boolean)
              .join(', ')}
            accessibilityHint="Abre las compras y estadísticas del evento"
            style={styles.card}
          >
            {item.multimedia?.[0] ? (
              <Image source={{ uri: item.multimedia[0] }} style={styles.img} accessible={false} />
            ) : (
              <View style={[styles.img, styles.imgPh]}>
                <Ionicons name="image-outline" size={22} color={colors.muted} />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{item.nombre}</Text>
              <InfoRow icon="calendar-outline">
                {formatFechaDDMMYYYY(item.fecha, { withTime: true })}
                {item.yaSeRealizo ? ' · Finalizado' : ''}
              </InfoRow>
              <InfoRow icon="ticket-outline">
                {item.cupoDisponible} disponibles · {item.tiposEntrada.map((t) => t.nombre).join(', ')}
              </InfoRow>
              <InfoRow icon="star-outline">{labelPuntaje(item.puntajeOrganizador, item.cantidadResenias)}</InfoRow>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.muted} />
          </Card>
        )}
        ListEmptyComponent={
          loading ? (
            <StateView loading />
          ) : error ? (
            <StateView error={error} onRetry={reload} />
          ) : (
            <StateView icon="calendar-outline" empty="Todavía no creaste eventos" />
          )
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, paddingBottom: 32 },
  headerBlock: { marginBottom: 16, gap: 12 },
  hello: { color: colors.muted, fontSize: 15 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  img: { width: 64, height: 64, borderRadius: radius.sm, backgroundColor: '#e2e8f0' },
  imgPh: { alignItems: 'center', justifyContent: 'center' },
  title: { fontWeight: '800', fontSize: 16, color: colors.text },
});
