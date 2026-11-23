import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  FlatList,
  Image,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Chip from '../components/Chip';
import Card from '../components/Card';
import StateView from '../components/StateView';
import FavoritoButton from '../components/FavoritoButton';
import LogoutButton from '../components/LogoutButton';
import InfoRow from '../components/InfoRow';
import { Placeholder } from '../components/ImageGallery';
import { EventosApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import useLoader from '../hooks/useLoader';
import useFavorito from '../hooks/useFavorito';
import { colors, MIN_TOUCH, radius } from '../theme';
import {
  formatFechaDDMMYYYY,
  formatFechaLarga,
  formatMoney,
  labelPuntaje,
  a11yPuntaje,
  plural,
} from '../utils/format';

const ORDENES = [
  { key: 'fecha', label: 'Fecha', defaultDir: 'asc' },
  { key: 'precio', label: 'Precio', defaultDir: 'asc' },
  { key: 'puntaje', label: 'Puntaje', defaultDir: 'desc' },
];

function useDebounced(value, ms = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

const soloDigitos = (v) => v.replace(/[^0-9]/g, '');

export default function CatalogoScreen({ navigation }) {
  const { user } = useAuth();
  const { esFavorito, toggle } = useFavorito();
  const [q, setQ] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [soloFavoritos, setSoloFavoritos] = useState(false);
  const [incluirFinalizados, setIncluirFinalizados] = useState(false);
  const [orden, setOrden] = useState('fecha');
  const [dir, setDir] = useState('asc');
  const [precioMin, setPrecioMin] = useState('');
  const [precioMax, setPrecioMax] = useState('');
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [categorias, setCategorias] = useState([]);

  const qDebounced = useDebounced(q);
  const minDebounced = useDebounced(precioMin, 500);
  const maxDebounced = useDebounced(precioMax, 500);
  const rangoInvalido =
    minDebounced !== '' && maxDebounced !== '' && Number(minDebounced) > Number(maxDebounced);

  useEffect(() => {
    EventosApi.categorias().then(setCategorias).catch(() => {});
  }, []);

  const { data: eventos, loading, refreshing, error, reload, refresh } = useLoader(
    () =>
      rangoInvalido
        ? Promise.resolve([])
        : EventosApi.listar({
            q: qDebounced.trim(),
            categoriaId,
            soloFavoritos,
            proximos: !incluirFinalizados,
            precioMin: minDebounced,
            precioMax: maxDebounced,
            orden,
            dir,
          }),
    [qDebounced, categoriaId, soloFavoritos, incluirFinalizados, minDebounced, maxDebounced, orden, dir, rangoInvalido],
  );

  const hayFiltros = !!(q || categoriaId || soloFavoritos || precioMin || precioMax || incluirFinalizados);
  const filtrosAvanzados = [precioMin || precioMax, incluirFinalizados].filter(Boolean).length;

  const limpiar = () => {
    setQ('');
    setCategoriaId('');
    setSoloFavoritos(false);
    setPrecioMin('');
    setPrecioMax('');
    setIncluirFinalizados(false);
  };

  const onOrdenPress = (key, defaultDir) => {
    if (orden === key) setDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setOrden(key);
      setDir(defaultDir);
    }
  };

  const lista = soloFavoritos
    ? (eventos || []).filter((e) => esFavorito(e.id))
    : eventos || [];

  const header = (
    <View style={styles.filters}>
      <Text style={styles.hello}>Hola, {user?.nombre} 👋</Text>

      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color={colors.muted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nombre, lugar o categoría"
          placeholderTextColor={colors.muted}
          value={q}
          onChangeText={setQ}
          autoCorrect={false}
          returnKeyType="search"
          accessibilityLabel="Buscar eventos"
          accessibilityHint="Filtra por nombre, descripción, dirección o categoría"
        />
        {!!q && (
          <Pressable
            onPress={() => setQ('')}
            accessibilityRole="button"
            accessibilityLabel="Borrar búsqueda"
            style={styles.clearBtn}
          >
            <Ionicons name="close-circle" size={20} color={colors.muted} />
          </Pressable>
        )}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        <Chip
          label="Favoritos"
          icon="heart-outline"
          selected={soloFavoritos}
          onPress={() => setSoloFavoritos((v) => !v)}
          accessibilityLabel="Solo favoritos"
        />
        <Chip label="Todas" selected={!categoriaId} onPress={() => setCategoriaId('')} accessibilityLabel="Todas las categorías" />
        {categorias.map((c) => (
          <Chip
            key={c.id}
            label={c.nombre}
            icon={c.icono}
            selected={categoriaId === c.id}
            onPress={() => setCategoriaId(categoriaId === c.id ? '' : c.id)}
            accessibilityLabel={`Categoría ${c.nombre}`}
          />
        ))}
      </ScrollView>

      <View style={styles.ordenRow}>
        <Text style={styles.filterLabel} nativeID="ordenLabel">
          Ordenar:
        </Text>
        {ORDENES.map((o) => {
          const activo = orden === o.key;
          const sentido = dir === 'asc' ? 'ascendente' : 'descendente';
          return (
            <Chip
              key={o.key}
              label={`${o.label}${activo ? (dir === 'asc' ? ' ↑' : ' ↓') : ''}`}
              selected={activo}
              onPress={() => onOrdenPress(o.key, o.defaultDir)}
              accessibilityLabel={`Ordenar por ${o.label.toLowerCase()}${activo ? `, ${sentido}` : ''}`}
              accessibilityHint={activo ? 'Tocá de nuevo para invertir el orden' : undefined}
            />
          );
        })}
      </View>

      <Pressable
        onPress={() => setMostrarFiltros((v) => !v)}
        accessibilityRole="button"
        accessibilityState={{ expanded: mostrarFiltros }}
        accessibilityLabel={`Más filtros${filtrosAvanzados ? `, ${filtrosAvanzados} activos` : ''}`}
        style={styles.toggleFiltros}
      >
        <Ionicons name="options-outline" size={18} color={colors.primary} />
        <Text style={styles.toggleText}>
          Más filtros{filtrosAvanzados ? ` (${filtrosAvanzados})` : ''}
        </Text>
        <Ionicons name={mostrarFiltros ? 'chevron-up' : 'chevron-down'} size={18} color={colors.primary} />
      </Pressable>

      {mostrarFiltros && (
        <View>
          <View style={styles.precioRow}>
            <TextInput
              style={[styles.precioInput, rangoInvalido && styles.inputError]}
              value={precioMin}
              onChangeText={(v) => setPrecioMin(soloDigitos(v))}
              keyboardType="number-pad"
              placeholder="Mínimo $"
              placeholderTextColor={colors.muted}
              accessibilityLabel="Precio mínimo"
            />
            <Text style={styles.filterLabel} importantForAccessibility="no">
              a
            </Text>
            <TextInput
              style={[styles.precioInput, rangoInvalido && styles.inputError]}
              value={precioMax}
              onChangeText={(v) => setPrecioMax(soloDigitos(v))}
              keyboardType="number-pad"
              placeholder="Máximo $"
              placeholderTextColor={colors.muted}
              accessibilityLabel="Precio máximo"
            />
          </View>
          <Text style={rangoInvalido ? styles.errorText : styles.hint} accessibilityLiveRegion="polite">
            {rangoInvalido
              ? 'El mínimo no puede ser mayor que el máximo'
              : 'Muestra eventos con al menos una entrada en ese rango'}
          </Text>
          <View style={{ marginTop: 10, alignSelf: 'flex-start' }}>
            <Chip
              label="Incluir eventos finalizados"
              icon="time-outline"
              selected={incluirFinalizados}
              onPress={() => setIncluirFinalizados((v) => !v)}
            />
          </View>
        </View>
      )}

      <View style={styles.resultRow}>
        <Text style={styles.resultText} accessibilityLiveRegion="polite">
          {loading ? 'Buscando…' : plural(lista.length, 'evento')}
        </Text>
        {hayFiltros && (
          <Pressable onPress={limpiar} accessibilityRole="button" style={styles.limpiarBtn}>
            <Text style={styles.limpiar}>Limpiar filtros</Text>
          </Pressable>
        )}
      </View>
    </View>
  );

  const renderItem = ({ item }) => {
    const fav = esFavorito(item.id);
    const a11y = [
      item.nombre,
      item.categoria?.nombre,
      formatFechaLarga(item.fecha),
      item.direccion,
      `desde ${formatMoney(item.precioDesde)}`,
      a11yPuntaje(item.puntajeOrganizador, item.cantidadResenias),
      item.cupoDisponible === 0 ? 'agotado' : null,
      item.yaSeRealizo ? 'evento finalizado' : null,
    ]
      .filter(Boolean)
      .join(', ');

    return (
      <View>
        <Card
          onPress={() => navigation.navigate('EventoDetalle', { id: item.id })}
          accessibilityLabel={a11y}
          accessibilityHint="Abre el detalle del evento"
          style={styles.card}
        >
          {item.multimedia?.[0] ? (
            <Image
              source={{ uri: item.multimedia[0] }}
              style={styles.cardImage}
              accessibilityIgnoresInvertColors
              accessible={false}
            />
          ) : (
            <Placeholder height={140} />
          )}
          <View style={styles.cardBody}>
            <Text style={styles.cardTitle}>{item.nombre}</Text>
            <InfoRow icon="calendar-outline">
              {formatFechaDDMMYYYY(item.fecha, { withTime: true })} · {item.categoria?.nombre}
            </InfoRow>
            {!!item.direccion && <InfoRow icon="location-outline">{item.direccion}</InfoRow>}
            <View style={styles.cardFooter}>
              <Text style={styles.precio}>Desde {formatMoney(item.precioDesde)}</Text>
              <Text style={styles.puntaje}>{labelPuntaje(item.puntajeOrganizador, item.cantidadResenias)}</Text>
            </View>
            {(item.yaSeRealizo || item.cupoDisponible === 0) && (
              <Text style={styles.tag}>{item.yaSeRealizo ? 'Finalizado' : 'Agotado'}</Text>
            )}
          </View>
        </Card>
        <FavoritoButton
          activo={fav}
          onPress={() => toggle(item)}
          nombreEvento={item.nombre}
          style={styles.favorito}
        />
      </View>
    );
  };

  return (
    <Screen title="Eventos" scroll={false} right={<LogoutButton />}>
      <FlatList
        data={error ? [] : lista}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={header}
        renderItem={renderItem}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[colors.primary]} />}
        ListEmptyComponent={
          loading ? (
            <StateView loading />
          ) : error ? (
            <StateView error={error} onRetry={reload} />
          ) : (
            <StateView
              icon={soloFavoritos ? 'heart-outline' : 'search-outline'}
              empty={soloFavoritos && !hayFiltros ? 'Todavía no guardaste favoritos' : 'No hay eventos para esos filtros'}
              actionLabel="Limpiar filtros"
              onAction={hayFiltros ? limpiar : undefined}
            />
          )
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, paddingTop: 0, paddingBottom: 32 },
  filters: { paddingTop: 12, paddingBottom: 4 },
  hello: { color: colors.muted, marginBottom: 8, fontSize: 15 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#fff',
    borderRadius: radius.sm,
    paddingLeft: 12,
    minHeight: MIN_TOUCH,
  },
  searchInput: { flex: 1, fontSize: 16, paddingVertical: 10, color: colors.text },
  clearBtn: { width: MIN_TOUCH, height: MIN_TOUCH, alignItems: 'center', justifyContent: 'center' },
  chips: { gap: 8, paddingVertical: 10 },
  ordenRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  filterLabel: { fontWeight: '600', color: colors.text },
  toggleFiltros: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: MIN_TOUCH,
    alignSelf: 'flex-start',
  },
  toggleText: { color: colors.primary, fontWeight: '700' },
  precioRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  precioInput: {
    flex: 1,
    minHeight: MIN_TOUCH,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    fontSize: 16,
    color: colors.text,
  },
  inputError: { borderColor: colors.danger, borderWidth: 2 },
  hint: { color: colors.muted, fontSize: 13, marginTop: 4 },
  errorText: { color: colors.danger, fontSize: 13, marginTop: 4, fontWeight: '600' },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 8 },
  resultText: { color: colors.muted, fontWeight: '600' },
  limpiarBtn: { minHeight: MIN_TOUCH, justifyContent: 'center' },
  limpiar: { color: colors.primary, fontWeight: '700' },
  card: { padding: 0, overflow: 'hidden' },
  cardImage: { width: '100%', height: 140, backgroundColor: '#e2e8f0' },
  cardBody: { padding: 14 },
  cardTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, gap: 8 },
  precio: { fontWeight: '800', color: colors.primaryDark, fontSize: 15 },
  puntaje: { color: colors.star, fontWeight: '700' },
  tag: {
    alignSelf: 'flex-start',
    marginTop: 8,
    backgroundColor: '#e5e7eb',
    color: '#374151',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    fontWeight: '700',
    overflow: 'hidden',
  },
  favorito: { position: 'absolute', top: 8, right: 8 },
});
