import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, ScrollView, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Card from '../components/Card';
import Chip from '../components/Chip';
import EstadoBadge from '../components/EstadoBadge';
import StateView from '../components/StateView';
import InfoRow from '../components/InfoRow';
import LogoutButton from '../components/LogoutButton';
import { ComprasApi } from '../api/client';
import useLoader from '../hooks/useLoader';
import { colors } from '../theme';
import { ORDEN_ESTADOS, labelEstado } from '../utils/estados';
import {
  formatFechaDDMMYYYY,
  formatFechaLarga,
  formatMoney,
  textoDiasRestantes,
} from '../utils/format';

export default function MisComprasScreen({ navigation }) {
  const [filtro, setFiltro] = useState('');
  const { data, loading, error, reload, refresh, refreshing } = useLoader(() => ComprasApi.mias(), []);
  const compras = data || [];
  const visibles = filtro ? compras.filter((c) => c.estado === filtro) : compras;
  const conteo = (estado) => compras.filter((c) => c.estado === estado).length;

  const header = (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
      <Chip label={`Todas (${compras.length})`} selected={!filtro} onPress={() => setFiltro('')} />
      {ORDEN_ESTADOS.filter((e) => conteo(e) > 0).map((e) => (
        <Chip
          key={e}
          label={`${labelEstado(e)} (${conteo(e)})`}
          selected={filtro === e}
          onPress={() => setFiltro(filtro === e ? '' : e)}
          accessibilityLabel={`Filtrar ${labelEstado(e)}, ${conteo(e)} compras`}
        />
      ))}
    </ScrollView>
  );

  return (
    <Screen title="Mis compras" scroll={false} right={<LogoutButton />}>
      <FlatList
        data={error ? [] : visibles}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={compras.length ? header : null}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[colors.primary]} />}
        renderItem={({ item }) => {
          const dias = textoDiasRestantes(item.diasRestantes);
          const pendientePago = item.acciones.includes('pagar');
          const paraReseniar = item.acciones.includes('reseniar');
          return (
            <Card
              onPress={() => navigation.navigate('CompraDetalle', { id: item.id })}
              accessibilityLabel={[
                item.evento.nombre,
                `Estado ${labelEstado(item.estado)}`,
                dias,
                `${item.cantidad} ${item.tipoEntrada.nombre}`,
                `total ${formatMoney(item.total)}`,
                formatFechaLarga(item.evento.fecha),
                pendientePago ? 'falta pagar' : null,
                paraReseniar ? 'podés dejar una reseña' : null,
              ]
                .filter(Boolean)
                .join(', ')}
              accessibilityHint="Abre el detalle de la compra"
            >
              <View style={styles.cardTop}>
                <Text style={styles.title}>{item.evento.nombre}</Text>
                <Ionicons name="chevron-forward" size={20} color={colors.muted} />
              </View>
              <EstadoBadge estado={item.estado} />
              {!!dias && <Text style={styles.dias}>{dias}</Text>}
              <InfoRow icon="ticket-outline">
                {item.cantidad} × {item.tipoEntrada.nombre} · {formatMoney(item.total)}
              </InfoRow>
              <InfoRow icon="calendar-outline">
                {formatFechaDDMMYYYY(item.evento.fecha, { withTime: true })}
              </InfoRow>
              {pendientePago && (
                <InfoRow icon="alert-circle-outline" color={colors.warning}>
                  Falta pagar para confirmar
                </InfoRow>
              )}
              {paraReseniar && (
                <InfoRow icon="star-outline" color={colors.star}>
                  Dejá tu reseña
                </InfoRow>
              )}
              {item.cantidadMensajes > 0 && (
                <InfoRow icon="chatbubbles-outline">{item.cantidadMensajes} mensaje(s)</InfoRow>
              )}
            </Card>
          );
        }}
        ListEmptyComponent={
          loading ? (
            <StateView loading />
          ) : error ? (
            <StateView error={error} onRetry={reload} />
          ) : (
            <StateView
              icon="ticket-outline"
              empty={filtro ? 'No hay compras en ese estado' : 'Todavía no tenés compras'}
              actionLabel={filtro ? 'Ver todas' : 'Explorar eventos'}
              onAction={() => (filtro ? setFiltro('') : navigation.navigate('Explorar'))}
            />
          )
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, paddingBottom: 32 },
  chips: { gap: 8, paddingBottom: 12 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  title: { fontWeight: '800', fontSize: 16, color: colors.text, flexShrink: 1 },
  dias: { color: colors.primaryDark, fontWeight: '800', marginTop: 6 },
});
