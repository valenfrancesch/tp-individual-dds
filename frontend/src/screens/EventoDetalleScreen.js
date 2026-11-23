import React, { useLayoutEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Button from '../components/Button';
import Card from '../components/Card';
import InfoRow from '../components/InfoRow';
import ImageGallery from '../components/ImageGallery';
import QuantityStepper from '../components/QuantityStepper';
import StarRating from '../components/StarRating';
import FavoritoButton from '../components/FavoritoButton';
import { ComprasApi, EventosApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import useLoader from '../hooks/useLoader';
import useFavorito from '../hooks/useFavorito';
import { colors, MIN_TOUCH, radius } from '../theme';
import { confirm, notify } from '../utils/dialogs';
import {
  formatFechaDDMMYYYY,
  formatFechaLarga,
  formatMoney,
  labelPuntaje,
  a11yPuntaje,
  plural,
} from '../utils/format';

export default function EventoDetalleScreen({ route, navigation }) {
  const { id } = route.params;
  const { hasRole } = useAuth();
  const { esFavorito, toggle } = useFavorito();
  const [tipoId, setTipoId] = useState(null);
  const [cantidad, setCantidad] = useState(1);
  const [busy, setBusy] = useState(false);

  const { data: evento, loading, error, reload, refresh, refreshing } = useLoader(
    () => EventosApi.obtener(id),
    [id],
  );

  useLayoutEffect(() => {
    if (!evento) return;
    navigation.setOptions({
      title: evento.nombre,
      headerRight: hasRole('COMPRADOR')
        ? () => (
            <FavoritoButton
              activo={esFavorito(evento.id)}
              onPress={() => toggle(evento)}
              nombreEvento={evento.nombre}
            />
          )
        : undefined,
    });
  });

  const tipo = useMemo(
    () => evento?.tiposEntrada.find((t) => t.id === tipoId) || null,
    [evento, tipoId],
  );
  const total = tipo ? tipo.precio * cantidad : 0;
  const puedeComprar = hasRole('COMPRADOR') && evento && !evento.esMio && !evento.yaSeRealizo;

  const elegirTipo = (t) => {
    if (t.cupo === 0) return;
    setTipoId(t.id);
    setCantidad((c) => Math.min(Math.max(1, c), t.cupo));
  };

  const comprar = async () => {
    if (!tipo) return;
    const ok = await confirm({
      title: 'Confirmar compra',
      message: `${plural(cantidad, 'entrada')} ${tipo.nombre} para "${evento.nombre}".\nTotal: ${formatMoney(total)}\n\nLa reserva queda pendiente de pago hasta que la pagues.`,
      confirmText: 'Reservar',
    });
    if (!ok) return;
    try {
      setBusy(true);
      const compra = await ComprasApi.crear({ eventoId: evento.id, tipoEntradaId: tipo.id, cantidad });
      setTipoId(null);
      setCantidad(1);
      navigation.navigate('CompraDetalle', { id: compra.id, recienCreada: true });
    } catch (e) {
      notify('No se pudo reservar', e.message);
      reload();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen loading={loading} error={error} onRetry={reload} onRefresh={refresh} refreshing={refreshing}>
      {evento && (
        <>
          <ImageGallery imagenes={evento.multimedia} alt={evento.nombre} />

          <Text style={styles.title} accessibilityRole="header">
            {evento.nombre}
          </Text>
          <InfoRow icon="pricetag-outline">{evento.categoria?.nombre}</InfoRow>
          <InfoRow icon="calendar-outline" a11y={`Fecha: ${formatFechaLarga(evento.fecha)}`}>
            {formatFechaDDMMYYYY(evento.fecha, { withTime: true })}
          </InfoRow>
          {!!evento.direccion && (
            <InfoRow icon="location-outline" a11y={`Dirección: ${evento.direccion}`}>
              {evento.direccion}
            </InfoRow>
          )}
          <InfoRow
            icon="person-circle-outline"
            a11y={`Organiza ${evento.organizador?.nombre} ${evento.organizador?.apellido}. ${a11yPuntaje(evento.puntajeOrganizador, evento.cantidadResenias)}`}
          >
            {evento.organizador?.nombre} {evento.organizador?.apellido} ·{' '}
            {labelPuntaje(evento.puntajeOrganizador, evento.cantidadResenias)}
          </InfoRow>

          {!!evento.descripcion && <Text style={styles.desc}>{evento.descripcion}</Text>}

          {evento.yaSeRealizo && (
            <View style={styles.aviso} accessibilityRole="text">
              <Ionicons name="information-circle-outline" size={18} color={colors.warning} />
              <Text style={styles.avisoText}>Este evento ya se realizó.</Text>
            </View>
          )}

          <Text style={styles.section} accessibilityRole="header">
            Entradas
          </Text>
          <View accessibilityRole="radiogroup" accessibilityLabel="Tipo de entrada">
            {evento.tiposEntrada.map((t) => {
              const seleccionado = tipoId === t.id;
              const agotado = t.cupo === 0;
              const seleccionable = puedeComprar && !agotado;
              const contenido = (
                <>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.tipoTitle}>{t.nombre}</Text>
                    {!!t.descripcion && <Text style={styles.meta}>{t.descripcion}</Text>}
                    <Text style={[styles.meta, agotado && styles.agotado]}>
                      {agotado ? 'Agotado' : `Quedan ${t.cupo}`}
                    </Text>
                  </View>
                  <Text style={styles.tipoPrecio}>{formatMoney(t.precio)}</Text>
                  {seleccionable && (
                    <Ionicons
                      name={seleccionado ? 'radio-button-on' : 'radio-button-off'}
                      size={24}
                      color={seleccionado ? colors.primary : colors.muted}
                    />
                  )}
                </>
              );
              return seleccionable ? (
                <Pressable
                  key={t.id}
                  onPress={() => elegirTipo(t)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: seleccionado }}
                  accessibilityLabel={`${t.nombre}, ${formatMoney(t.precio)}, quedan ${t.cupo}`}
                  style={[styles.tipo, seleccionado && styles.tipoSel]}
                >
                  {contenido}
                </Pressable>
              ) : (
                <View
                  key={t.id}
                  style={[styles.tipo, agotado && styles.tipoAgotado]}
                  accessible
                  accessibilityLabel={`${t.nombre}, ${formatMoney(t.precio)}, ${agotado ? 'agotado' : `quedan ${t.cupo}`}`}
                >
                  {contenido}
                </View>
              );
            })}
          </View>

          {puedeComprar && (
            <Card style={styles.buyBox}>
              {tipo ? (
                <>
                  <View style={styles.buyRow}>
                    <Text style={styles.buyLabel}>Cantidad</Text>
                    <QuantityStepper
                      value={cantidad}
                      min={1}
                      max={tipo.cupo}
                      onChange={setCantidad}
                      label={`Cantidad de entradas ${tipo.nombre}`}
                    />
                  </View>
                  <Text style={styles.total} accessibilityLiveRegion="polite">
                    Total: {formatMoney(total)}
                  </Text>
                </>
              ) : (
                <Text style={styles.meta}>Elegí un tipo de entrada para continuar.</Text>
              )}
              <Button
                title="Comprar"
                icon="cart-outline"
                onPress={comprar}
                busy={busy}
                disabled={!tipo}
                accessibilityHint="Reserva las entradas y te lleva a pagarlas"
              />
            </Card>
          )}
          {evento.esMio && (
            <Text style={styles.meta}>Sos el organizador de este evento.</Text>
          )}

          <Text style={styles.section} accessibilityRole="header">
            Reseñas del organizador
          </Text>
          {evento.reseniasOrganizador?.length ? (
            evento.reseniasOrganizador.map((r) => (
              <Card key={r.id}>
                <StarRating value={r.puntuacion} size={16} />
                <Text style={styles.reviewMeta}>
                  {r.comprador?.nombre} · {r.evento?.nombre}
                </Text>
                {!!r.detalle && <Text style={styles.reviewText}>{r.detalle}</Text>}
              </Card>
            ))
          ) : (
            <Text style={styles.meta}>Este organizador todavía no tiene reseñas.</Text>
          )}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: 4 },
  meta: { color: colors.muted, marginTop: 2 },
  desc: { marginTop: 12, color: colors.text, lineHeight: 22, fontSize: 15 },
  aviso: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    padding: 10,
    borderRadius: radius.sm,
    marginTop: 12,
  },
  avisoText: { color: colors.warning, fontWeight: '600' },
  section: { marginTop: 24, marginBottom: 8, fontWeight: '800', fontSize: 18, color: colors.text },
  tipo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    minHeight: MIN_TOUCH,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  tipoSel: { borderColor: colors.primary, borderWidth: 2, backgroundColor: '#f0fdfa' },
  tipoAgotado: { opacity: 0.6 },
  tipoTitle: { fontWeight: '700', color: colors.text, fontSize: 16 },
  tipoPrecio: { fontWeight: '800', color: colors.primaryDark, fontSize: 16 },
  agotado: { color: colors.danger, fontWeight: '700' },
  buyBox: { gap: 12, marginTop: 8 },
  buyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 },
  buyLabel: { fontWeight: '700', color: colors.text, fontSize: 15 },
  total: { fontWeight: '800', fontSize: 18, color: colors.text },
  reviewMeta: { color: colors.muted, marginTop: 4 },
  reviewText: { color: colors.text, marginTop: 4 },
});
