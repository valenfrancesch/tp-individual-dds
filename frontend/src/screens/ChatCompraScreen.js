import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useHeaderHeight } from '@react-navigation/elements';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import EstadoBadge from '../components/EstadoBadge';
import StateView from '../components/StateView';
import { ComprasApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { colors, MIN_TOUCH, radius } from '../theme';
import { formatFechaDDMMYYYY, formatFechaLarga, formatMoney } from '../utils/format';
import { announce } from '../utils/dialogs';

const POLL_MS = 5000;

export default function ChatCompraScreen({ route }) {
  const { compraId } = route.params;
  const { user } = useAuth();
  const headerHeight = useHeaderHeight();
  const [mensajes, setMensajes] = useState([]);
  const [compra, setCompra] = useState(null);
  const [texto, setTexto] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState(null);
  const listRef = useRef(null);
  const cantidadPrevia = useRef(0);

  const cargar = useCallback(async () => {
    try {
      const data = await ComprasApi.mensajes(compraId);
      setCompra(data.compra);
      setMensajes(data.mensajes);
      // Anunciar mensajes nuevos de la otra parte (lectores de pantalla).
      const nuevos = data.mensajes.slice(cantidadPrevia.current).filter((m) => m.usuario?.id !== user.id);
      if (cantidadPrevia.current && nuevos.length) {
        announce(`Nuevo mensaje de ${nuevos[nuevos.length - 1].usuario?.nombre}`);
      }
      cantidadPrevia.current = data.mensajes.length;
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [compraId, user.id]);

  // Polling mientras la pantalla está visible.
  useFocusEffect(
    useCallback(() => {
      cargar();
      const t = setInterval(cargar, POLL_MS);
      return () => clearInterval(t);
    }, [cargar]),
  );

  const enviar = async () => {
    const limpio = texto.trim();
    if (!limpio || enviando) return;
    try {
      setEnviando(true);
      setErrorEnvio(null);
      const mensaje = await ComprasApi.enviarMensaje(compraId, limpio);
      setTexto('');
      setMensajes((prev) => [...prev, mensaje]);
      cantidadPrevia.current += 1;
      announce('Mensaje enviado');
    } catch (e) {
      setErrorEnvio(e.message);
    } finally {
      setEnviando(false);
    }
  };

  if (loading || (error && !compra)) {
    return (
      <Screen scroll={false}>
        <StateView loading={loading} error={error} onRetry={cargar} />
      </Screen>
    );
  }

  const soyOrganizador = compra?.evento.organizador?.id === user.id;
  const otraParte = soyOrganizador
    ? `${compra.comprador.nombre} ${compra.comprador.apellido}`
    : `${compra.evento.organizador?.nombre} ${compra.evento.organizador?.apellido}`;
  const puedeEnviar = !!texto.trim() && !enviando;

  return (
    <Screen scroll={false} edges={['left', 'right', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={headerHeight}
      >
        <View style={styles.headerCard} accessible accessibilityLabel={`Conversación con ${otraParte} sobre ${compra.evento.nombre}`}>
          <Text style={styles.headerTitle}>{compra.evento.nombre}</Text>
          <Text style={styles.meta}>
            {formatFechaDDMMYYYY(compra.evento.fecha, { withTime: true })} · {compra.cantidad} ×{' '}
            {compra.tipoEntrada.nombre} · {formatMoney(compra.total)}
          </Text>
          <Text style={styles.meta}>
            {soyOrganizador ? 'Comprador' : 'Organizador'}: {otraParte}
            {soyOrganizador && compra.comprador.email ? ` · ${compra.comprador.email}` : ''}
          </Text>
          <View style={{ marginTop: 6 }}>
            <EstadoBadge estado={compra.estado} />
          </View>
        </View>

        <FlatList
          ref={listRef}
          data={mensajes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => {
            const mine = item.usuario?.id === user.id;
            return (
              <View
                style={[styles.bubble, mine ? styles.mine : styles.theirs]}
                accessible
                accessibilityLabel={`${mine ? 'Vos' : item.usuario?.nombre}: ${item.mensaje}. ${formatFechaLarga(item.enviado)}`}
              >
                {!mine && <Text style={styles.author}>{item.usuario?.nombre}</Text>}
                <Text style={[styles.msg, mine && styles.msgMine]}>{item.mensaje}</Text>
                <Text style={[styles.time, mine && styles.timeMine]}>
                  {formatFechaDDMMYYYY(item.enviado, { withTime: true })}
                </Text>
              </View>
            );
          }}
          ListEmptyComponent={
            <StateView icon="chatbubbles-outline" empty={`Escribile a ${otraParte} sobre el evento, el acceso o cambios de fecha.`} />
          }
        />

        {!!errorEnvio && (
          <Text style={styles.errorEnvio} accessibilityRole="alert">
            {errorEnvio}
          </Text>
        )}
        <View style={styles.composer}>
          <TextInput
            style={styles.input}
            placeholder="Escribí un mensaje…"
            placeholderTextColor={colors.muted}
            value={texto}
            onChangeText={setTexto}
            onSubmitEditing={enviar}
            onKeyPress={(e) => {
              // En web, Enter envía y Shift+Enter agrega una línea.
              if (Platform.OS === 'web' && e.nativeEvent.key === 'Enter' && !e.nativeEvent.shiftKey) {
                e.preventDefault();
                enviar();
              }
            }}
            returnKeyType="send"
            submitBehavior="submit"
            maxLength={1000}
            multiline
            accessibilityLabel={`Mensaje para ${otraParte}`}
          />
          <Pressable
            style={[styles.btn, !puedeEnviar && styles.btnDisabled]}
            onPress={enviar}
            disabled={!puedeEnviar}
            accessibilityRole="button"
            accessibilityLabel="Enviar mensaje"
            accessibilityState={{ disabled: !puedeEnviar, busy: enviando }}
          >
            <Ionicons name="send" size={20} color="#fff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerCard: {
    backgroundColor: '#fff',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { fontWeight: '800', fontSize: 16, color: colors.text },
  meta: { color: colors.muted, marginTop: 2 },
  list: { padding: 16, flexGrow: 1 },
  bubble: { maxWidth: '85%', padding: 10, borderRadius: radius.md, marginBottom: 8 },
  mine: { alignSelf: 'flex-end', backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  theirs: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: 4,
  },
  author: { fontWeight: '700', marginBottom: 2, color: colors.primaryDark, fontSize: 13 },
  msg: { color: colors.text, fontSize: 15 },
  msgMine: { color: '#fff' },
  time: { fontSize: 12, color: colors.muted, marginTop: 4 },
  timeMine: { color: '#e6fffa' },
  errorEnvio: { color: colors.danger, paddingHorizontal: 16, fontWeight: '600' },
  composer: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: '#fff',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    minHeight: MIN_TOUCH,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.text,
  },
  btn: {
    width: MIN_TOUCH + 4,
    height: MIN_TOUCH + 4,
    borderRadius: (MIN_TOUCH + 4) / 2,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: { opacity: 0.4 },
});
