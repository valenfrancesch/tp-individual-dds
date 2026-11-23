import React, { useLayoutEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ScrollView, RefreshControl } from 'react-native';
import Screen from '../components/Screen';
import Card from '../components/Card';
import Chip from '../components/Chip';
import Button from '../components/Button';
import EstadoBadge from '../components/EstadoBadge';
import StateView from '../components/StateView';
import InfoRow from '../components/InfoRow';
import AccionesCompra from '../components/AccionesCompra';
import { ComprasApi } from '../api/client';
import useLoader from '../hooks/useLoader';
import { colors, radius } from '../theme';
import { ESTADOS, ORDEN_ESTADOS, labelEstado } from '../utils/estados';
import { formatFechaDDMMYYYY, formatMoney } from '../utils/format';

export default function EventoComprasScreen({ route, navigation }) {
  const { eventoId } = route.params;
  const [filtro, setFiltro] = useState('');
  const { data, loading, error, reload, refresh, refreshing } = useLoader(
    () => ComprasApi.porEvento(eventoId, filtro || undefined),
    [eventoId, filtro],
  );

  useLayoutEffect(() => {
    if (data?.evento) navigation.setOptions({ title: data.evento.nombre });
  }, [data?.evento, navigation]);

  const stats = data?.estadisticas;
  const evento = data?.evento;

  const header = evento && (
    <View>
      <Card>
        <InfoRow icon="calendar-outline">{formatFechaDDMMYYYY(evento.fecha, { withTime: true })}</InfoRow>
        {!!evento.direccion && <InfoRow icon="location-outline">{evento.direccion}</InfoRow>}
        <Button
          title="Ver publicación"
          icon="eye-outline"
          variant="ghost"
          small
          style={{ alignSelf: 'flex-start', marginTop: 4 }}
          onPress={() => navigation.navigate('EventoDetalle', { id: evento.id })}
        />
      </Card>

      <Text style={styles.section} accessibilityRole="header">
        Entradas por tipo
      </Text>
      {stats.porTipo.map((t) => {
        const total = t.vendidas + t.pendientes + t.disponibles;
        const pct = total ? (t.vendidas / total) * 100 : 0;
        const pctPend = total ? (t.pendientes / total) * 100 : 0;
        return (
          <View
            key={t.id}
            style={styles.tipo}
            accessible
            accessibilityLabel={`${t.nombre}: ${t.vendidas} vendidas, ${t.pendientes} pendientes de pago, ${t.disponibles} disponibles`}
          >
            <View style={styles.tipoTop}>
              <Text style={styles.tipoNombre}>
                {t.nombre} · {formatMoney(t.precio)}
              </Text>
              <Text style={[styles.disponibles, t.disponibles === 0 && { color: colors.danger }]}>
                {t.disponibles === 0 ? 'Agotado' : `${t.disponibles} disponibles`}
              </Text>
            </View>
            <View style={styles.barra}>
              <View style={[styles.barraVendida, { width: `${pct}%` }]} />
              <View style={[styles.barraPendiente, { width: `${pctPend}%` }]} />
            </View>
            <Text style={styles.meta}>
              {t.vendidas} vendidas · {t.pendientes} pendientes
            </Text>
          </View>
        );
      })}

      <Text style={styles.section} accessibilityRole="header">
        Compras
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        <Chip label="Todas" selected={!filtro} onPress={() => setFiltro('')} />
        {ORDEN_ESTADOS.map((e) => (
          <Chip
            key={e}
            label={`${labelEstado(e)} (${stats.porEstado[e] || 0})`}
            selected={filtro === e}
            onPress={() => setFiltro(filtro === e ? '' : e)}
            accessibilityLabel={`Filtrar ${labelEstado(e)}, ${stats.porEstado[e] || 0} compras`}
          />
        ))}
      </ScrollView>
    </View>
  );

  return (
    <Screen scroll={false} loading={loading} error={error} onRetry={reload}>
      <FlatList
        data={data?.compras || []}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={header}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[colors.primary]} />}
        renderItem={({ item }) => (
          <Card>
            <View style={styles.cardTop}>
              <Text style={styles.title}>
                {item.comprador?.nombre} {item.comprador?.apellido}
              </Text>
              <EstadoBadge estado={item.estado} />
            </View>
            <InfoRow icon="ticket-outline">
              {item.cantidad} × {item.tipoEntrada.nombre} · {formatMoney(item.total)}
            </InfoRow>
            <InfoRow icon="time-outline">Comprada el {formatFechaDDMMYYYY(item.fecha, { withTime: true })}</InfoRow>
            {item.estado === 'CANCELADA' && item.fuePagada && (
              <InfoRow icon="alert-circle-outline" color={ESTADOS.PENDIENTE.color}>
                Reembolso pendiente
              </InfoRow>
            )}
            <AccionesCompra compra={item} onDone={() => reload()} small />
            <View style={styles.links}>
              <Button
                small
                variant="ghost"
                icon="chatbubbles-outline"
                title={`Chat${item.cantidadMensajes ? ` (${item.cantidadMensajes})` : ''}`}
                accessibilityLabel={`Chat con ${item.comprador?.nombre}, ${item.cantidadMensajes} mensajes`}
                onPress={() => navigation.navigate('ChatCompra', { compraId: item.id })}
              />
              <Button
                small
                variant="ghost"
                icon="list-outline"
                title="Detalle"
                accessibilityLabel={`Detalle de la compra de ${item.comprador?.nombre}`}
                onPress={() => navigation.navigate('CompraDetalle', { id: item.id })}
              />
            </View>
          </Card>
        )}
        ListEmptyComponent={
          <StateView icon="receipt-outline" empty={filtro ? 'No hay compras en ese estado' : 'Todavía no hay compras'} />
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, paddingBottom: 32 },
  section: { fontWeight: '800', fontSize: 18, color: colors.text, marginTop: 8, marginBottom: 8 },
  tipo: {
    backgroundColor: '#fff',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 8,
  },
  tipoTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' },
  tipoNombre: { fontWeight: '700', color: colors.text },
  disponibles: { fontWeight: '800', color: colors.primaryDark },
  barra: {
    flexDirection: 'row',
    height: 10,
    borderRadius: 5,
    backgroundColor: '#e2e8f0',
    overflow: 'hidden',
    marginVertical: 8,
  },
  barraVendida: { backgroundColor: colors.primary },
  barraPendiente: { backgroundColor: '#f59e0b' },
  meta: { color: colors.muted, fontSize: 13 },
  chips: { gap: 8, paddingBottom: 12 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' },
  title: { fontWeight: '800', color: colors.text, fontSize: 16 },
  links: { flexDirection: 'row', gap: 8, marginTop: 4 },
});
