import React, { useState } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Card from '../components/Card';
import Button from '../components/Button';
import Field from '../components/Field';
import EstadoBadge from '../components/EstadoBadge';
import InfoRow from '../components/InfoRow';
import StarRating from '../components/StarRating';
import AccionesCompra from '../components/AccionesCompra';
import { ComprasApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import useLoader from '../hooks/useLoader';
import { colors, radius } from '../theme';
import { ESTADOS, labelEstado } from '../utils/estados';
import { announce, notify } from '../utils/dialogs';
import {
  formatFechaDDMMYYYY,
  formatFechaLarga,
  formatMoney,
  textoDiasRestantes,
} from '../utils/format';

export default function CompraDetalleScreen({ route, navigation }) {
  const { id, recienCreada } = route.params;
  const { user } = useAuth();
  const [puntuacion, setPuntuacion] = useState(0);
  const [detalle, setDetalle] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [errorResenia, setErrorResenia] = useState(null);

  const { data: compra, setData, loading, error, reload, refresh, refreshing } = useLoader(
    () => ComprasApi.obtener(id),
    [id],
  );

  const soyOrganizador = compra && compra.evento.organizador?.id === user.id;

  const enviarResenia = async () => {
    if (!puntuacion) {
      setErrorResenia('Elegí entre 1 y 5 estrellas');
      return;
    }
    try {
      setEnviando(true);
      setErrorResenia(null);
      await ComprasApi.reseniar(compra.id, { puntuacion, detalle });
      announce('¡Gracias! Reseña enviada');
      notify('¡Gracias!', 'Tu reseña ya es visible para otros compradores.');
      reload();
    } catch (e) {
      setErrorResenia(e.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Screen loading={loading} error={error} onRetry={reload} onRefresh={refresh} refreshing={refreshing}>
      {compra && (
        <>
          {recienCreada && compra.estado === 'PENDIENTE' && (
            <View style={styles.banner} accessibilityRole="alert">
              <Ionicons name="time-outline" size={20} color={ESTADOS.PENDIENTE.color} />
              <Text style={styles.bannerText}>
                Reservamos tus entradas. Pagá para confirmar la compra.
              </Text>
            </View>
          )}

          <Card
            onPress={() => navigation.navigate('EventoDetalle', { id: compra.evento.id })}
            accessibilityLabel={`Evento ${compra.evento.nombre}, ${formatFechaLarga(compra.evento.fecha)}`}
            accessibilityHint="Abre el detalle del evento"
            style={styles.eventoCard}
          >
            {!!compra.evento.imagen && (
              <Image source={{ uri: compra.evento.imagen }} style={styles.img} accessible={false} />
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{compra.evento.nombre}</Text>
              <InfoRow icon="calendar-outline">
                {formatFechaDDMMYYYY(compra.evento.fecha, { withTime: true })}
              </InfoRow>
              {!!compra.evento.direccion && <InfoRow icon="location-outline">{compra.evento.direccion}</InfoRow>}
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.muted} />
          </Card>

          <Card>
            <EstadoBadge estado={compra.estado} />
            {compra.diasRestantes != null && (
              <Text style={styles.dias}>{textoDiasRestantes(compra.diasRestantes)}</Text>
            )}
            <View style={styles.linea}>
              <Text style={styles.label}>Entradas</Text>
              <Text style={styles.valor}>
                {compra.cantidad} × {compra.tipoEntrada.nombre} ({formatMoney(compra.tipoEntrada.precio)})
              </Text>
            </View>
            <View style={styles.linea}>
              <Text style={styles.label}>Total</Text>
              <Text style={[styles.valor, styles.total]}>{formatMoney(compra.total)}</Text>
            </View>
            {soyOrganizador && (
              <View style={styles.linea}>
                <Text style={styles.label}>Comprador</Text>
                <Text style={styles.valor}>
                  {compra.comprador.nombre} {compra.comprador.apellido}
                  {compra.comprador.email ? `\n${compra.comprador.email}` : ''}
                </Text>
              </View>
            )}
            {compra.estado === 'CANCELADA' && compra.fuePagada && (
              <Text style={styles.nota}>
                {soyOrganizador
                  ? 'Recordá devolver el dinero y registrarlo como reembolsada.'
                  : 'El organizador está procesando tu reembolso.'}
              </Text>
            )}

            <AccionesCompra compra={compra} onDone={setData} excluir={['reseniar']} />
            <Button
              title={`Chat${compra.cantidadMensajes ? ` (${compra.cantidadMensajes})` : ''}`}
              icon="chatbubbles-outline"
              variant="secondary"
              style={{ marginTop: 8 }}
              accessibilityLabel={`Abrir chat con ${soyOrganizador ? 'el comprador' : 'el organizador'}, ${compra.cantidadMensajes} mensajes`}
              onPress={() => navigation.navigate('ChatCompra', { compraId: compra.id })}
            />
          </Card>

          {compra.acciones.includes('reseniar') && (
            <Card>
              <Text style={styles.section} accessibilityRole="header">
                ¿Cómo estuvo el evento?
              </Text>
              <StarRating value={puntuacion} onChange={setPuntuacion} label="Puntaje del evento" />
              <Field
                label="Comentario (opcional)"
                value={detalle}
                onChangeText={setDetalle}
                multiline
                maxLength={500}
                placeholder="Contá tu experiencia"
                inputStyle={{ minHeight: 80, textAlignVertical: 'top' }}
                style={{ marginTop: 12 }}
                error={errorResenia}
              />
              <Button title="Enviar reseña" icon="send-outline" onPress={enviarResenia} busy={enviando} />
            </Card>
          )}
          {compra.resenia && (
            <Card>
              <Text style={styles.section} accessibilityRole="header">
                Reseña
              </Text>
              <StarRating value={compra.resenia.puntuacion} size={18} />
              {!!compra.resenia.detalle && <Text style={styles.valor}>{compra.resenia.detalle}</Text>}
            </Card>
          )}

          <Text style={styles.section} accessibilityRole="header">
            Historial
          </Text>
          <View accessibilityRole="list">
            {compra.historial.map((h, i) => {
              const e = ESTADOS[h.estado];
              const ultimo = i === compra.historial.length - 1;
              return (
                <View
                  key={`${h.estado}-${i}`}
                  style={styles.paso}
                  accessible
                  accessibilityLabel={`${labelEstado(h.estado)}, ${formatFechaLarga(h.fechaHora)}, por ${h.quien?.nombre}`}
                >
                  <View style={styles.timeline}>
                    <View style={[styles.dot, { backgroundColor: e?.color }]}>
                      <Ionicons name={e?.icon} size={14} color="#fff" />
                    </View>
                    {!ultimo && <View style={styles.lineaVertical} />}
                  </View>
                  <View style={styles.pasoBody}>
                    <Text style={styles.pasoTitle}>{labelEstado(h.estado)}</Text>
                    <Text style={styles.pasoMeta}>
                      {formatFechaDDMMYYYY(h.fechaHora, { withTime: true })} · {h.quien?.nombre} {h.quien?.apellido}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    backgroundColor: ESTADOS.PENDIENTE.bg,
    padding: 12,
    borderRadius: radius.sm,
    marginBottom: 12,
  },
  bannerText: { color: ESTADOS.PENDIENTE.color, fontWeight: '600', flexShrink: 1 },
  eventoCard: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  img: { width: 64, height: 64, borderRadius: radius.sm, backgroundColor: '#e2e8f0' },
  title: { fontWeight: '800', fontSize: 17, color: colors.text },
  dias: { color: colors.primaryDark, fontWeight: '800', fontSize: 16, marginTop: 8 },
  linea: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 10 },
  label: { color: colors.muted, fontWeight: '600' },
  valor: { color: colors.text, flexShrink: 1, textAlign: 'right' },
  total: { fontWeight: '800', fontSize: 16 },
  nota: { marginTop: 10, color: colors.warning, fontWeight: '600' },
  section: { fontWeight: '800', fontSize: 18, color: colors.text, marginVertical: 8 },
  paso: { flexDirection: 'row', gap: 12 },
  timeline: { alignItems: 'center', width: 24 },
  dot: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  lineaVertical: { width: 2, flex: 1, backgroundColor: colors.border, minHeight: 24 },
  pasoBody: { paddingBottom: 16, flex: 1 },
  pasoTitle: { fontWeight: '700', color: colors.text },
  pasoMeta: { color: colors.muted, fontSize: 13, marginTop: 2 },
});
