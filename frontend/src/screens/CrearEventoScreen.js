import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Field from '../components/Field';
import Button from '../components/Button';
import Chip from '../components/Chip';
import Card from '../components/Card';
import DateTimeField from '../components/DateTimeField';
import { EventosApi } from '../api/client';
import { colors, MIN_TOUCH, radius } from '../theme';
import { notify } from '../utils/dialogs';

const nuevoTipo = (nombre = '', precio = '', cupo = '') => ({
  key: Math.random().toString(36).slice(2),
  nombre,
  descripcion: '',
  precio,
  cupo,
});

const esUrl = (u) => /^https?:\/\/\S+$/i.test(u.trim());
const soloDigitos = (v) => v.replace(/[^0-9]/g, '');

function validar({ nombre, categoriaId, fecha, tipos, imagenes }) {
  const errores = { tipos: {} };
  if (!nombre.trim()) errores.nombre = 'Ingresá un nombre';
  if (!categoriaId) errores.categoria = 'Elegí una categoría';
  if (!fecha || new Date(fecha) <= new Date()) errores.fecha = 'La fecha debe ser futura';
  tipos.forEach((t) => {
    const e = {};
    if (!t.nombre.trim()) e.nombre = 'Falta el nombre';
    if (!(Number(t.precio) > 0)) e.precio = 'Precio mayor a 0';
    if (!(Number.isInteger(Number(t.cupo)) && Number(t.cupo) > 0)) e.cupo = 'Cupo entero mayor a 0';
    if (Object.keys(e).length) errores.tipos[t.key] = e;
  });
  const nombres = tipos.map((t) => t.nombre.trim().toLowerCase()).filter(Boolean);
  if (new Set(nombres).size !== nombres.length) errores.tiposGeneral = 'Hay tipos de entrada con el mismo nombre';
  const invalidas = imagenes.filter((u) => u.trim() && !esUrl(u));
  if (invalidas.length) errores.imagenes = 'Las URLs deben empezar con http:// o https://';

  const hay =
    Object.keys(errores).some((k) => k !== 'tipos') || Object.keys(errores.tipos).length > 0;
  return hay ? errores : null;
}

export default function CrearEventoScreen({ navigation }) {
  const [categorias, setCategorias] = useState([]);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [direccion, setDireccion] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [fecha, setFecha] = useState(() => {
    const d = new Date(Date.now() + 30 * 86400000);
    d.setHours(21, 0, 0, 0);
    return d.toISOString();
  });
  const [tipos, setTipos] = useState([nuevoTipo('General', '', ''), nuevoTipo('VIP', '', '')]);
  const [imagenes, setImagenes] = useState(['']);
  const [errores, setErrores] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    EventosApi.categorias()
      .then(setCategorias)
      .catch((e) => notify('No se pudieron cargar las categorías', e.message));
  }, []);

  // Revalidar en vivo una vez que el usuario intentó publicar.
  useEffect(() => {
    if (errores) setErrores(validar({ nombre, categoriaId, fecha, tipos, imagenes }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nombre, categoriaId, fecha, tipos, imagenes]);

  const updateTipo = (key, field, value) =>
    setTipos((prev) => prev.map((t) => (t.key === key ? { ...t, [field]: value } : t)));
  const removeTipo = (key) => setTipos((prev) => (prev.length > 1 ? prev.filter((t) => t.key !== key) : prev));
  const updateImagen = (i, v) => setImagenes((prev) => prev.map((u, j) => (j === i ? v : u)));

  const crear = async () => {
    const e = validar({ nombre, categoriaId, fecha, tipos, imagenes });
    setErrores(e);
    if (e) {
      notify('Revisá el formulario', 'Hay campos con errores marcados en rojo.');
      return;
    }
    try {
      setBusy(true);
      const evento = await EventosApi.crear({
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        direccion: direccion.trim(),
        categoriaId,
        fecha,
        tiposEntrada: tipos.map((t) => ({
          nombre: t.nombre.trim(),
          descripcion: t.descripcion.trim(),
          precio: Number(t.precio),
          cupo: Number(t.cupo),
        })),
        multimedia: imagenes.map((u) => u.trim()).filter(Boolean),
      });
      notify('Evento publicado', evento.nombre);
      navigation.replace('EventoCompras', { eventoId: evento.id });
    } catch (err) {
      notify('No se pudo publicar', err.message);
    } finally {
      setBusy(false);
    }
  };

  const errTipo = (key) => errores?.tipos?.[key] || {};

  return (
    <Screen>
      <Text style={styles.section} accessibilityRole="header">
        Datos del evento
      </Text>
      <Field label="Nombre *" value={nombre} onChangeText={setNombre} error={errores?.nombre} maxLength={120} />
      <Field
        label="Descripción"
        value={descripcion}
        onChangeText={setDescripcion}
        multiline
        maxLength={1000}
        inputStyle={{ minHeight: 90, textAlignVertical: 'top' }}
      />
      <Field
        label="Dirección"
        value={direccion}
        onChangeText={setDireccion}
        placeholder="Calle, número, ciudad"
        autoComplete="street-address"
      />

      <Text style={styles.label} nativeID="categoriaLabel">
        Categoría *
      </Text>
      <View style={styles.row} accessibilityRole="radiogroup" accessibilityLabel="Categoría">
        {categorias.map((c) => (
          <Chip
            key={c.id}
            label={c.nombre}
            icon={c.icono}
            selected={categoriaId === c.id}
            onPress={() => setCategoriaId(c.id)}
          />
        ))}
      </View>
      {!!errores?.categoria && <Text style={styles.error}>{errores.categoria}</Text>}

      <DateTimeField label="Fecha y hora *" value={fecha} onChange={setFecha} error={errores?.fecha} />

      <Text style={styles.section} accessibilityRole="header">
        Imágenes
      </Text>
      <Text style={styles.hint}>Pegá links a imágenes (http/https). La primera se usa como portada.</Text>
      {imagenes.map((url, i) => (
        <View key={`img-${i}`} style={styles.imgRow}>
          {esUrl(url) ? (
            <Image source={{ uri: url.trim() }} style={styles.preview} accessibilityLabel={`Vista previa imagen ${i + 1}`} />
          ) : (
            <View style={[styles.preview, styles.previewPh]}>
              <Ionicons name="image-outline" size={20} color={colors.muted} />
            </View>
          )}
          <Field
            label={`Imagen ${i + 1}`}
            value={url}
            onChangeText={(v) => updateImagen(i, v)}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            placeholder="https://…"
            style={{ flex: 1, marginBottom: 0 }}
          />
          <Pressable
            onPress={() => setImagenes((prev) => (prev.length > 1 ? prev.filter((_, j) => j !== i) : ['']))}
            accessibilityRole="button"
            accessibilityLabel={`Quitar imagen ${i + 1}`}
            style={styles.iconBtn}
          >
            <Ionicons name="trash-outline" size={20} color={colors.danger} />
          </Pressable>
        </View>
      ))}
      {!!errores?.imagenes && <Text style={styles.error}>{errores.imagenes}</Text>}
      {imagenes.length < 5 && (
        <Button
          title="Agregar imagen"
          icon="add"
          variant="ghost"
          small
          onPress={() => setImagenes((prev) => [...prev, ''])}
          style={{ alignSelf: 'flex-start' }}
        />
      )}

      <Text style={styles.section} accessibilityRole="header">
        Tipos de entrada
      </Text>
      {!!errores?.tiposGeneral && <Text style={styles.error}>{errores.tiposGeneral}</Text>}
      {tipos.map((t, index) => (
        <Card key={t.key}>
          <View style={styles.tipoHeader}>
            <Text style={styles.tipoTitle}>Tipo {index + 1}</Text>
            {tipos.length > 1 && (
              <Pressable
                onPress={() => removeTipo(t.key)}
                accessibilityRole="button"
                accessibilityLabel={`Quitar tipo de entrada ${t.nombre || index + 1}`}
                style={styles.iconBtn}
              >
                <Ionicons name="trash-outline" size={20} color={colors.danger} />
              </Pressable>
            )}
          </View>
          <Field
            label="Nombre *"
            value={t.nombre}
            onChangeText={(v) => updateTipo(t.key, 'nombre', v)}
            placeholder="Ej. Platea"
            error={errTipo(t.key).nombre}
          />
          <Field
            label="Descripción"
            value={t.descripcion}
            onChangeText={(v) => updateTipo(t.key, 'descripcion', v)}
            placeholder="Ej. Sector central, butaca numerada"
          />
          <View style={styles.row2}>
            <Field
              label="Precio ($) *"
              value={t.precio}
              onChangeText={(v) => updateTipo(t.key, 'precio', soloDigitos(v))}
              keyboardType="number-pad"
              error={errTipo(t.key).precio}
              style={{ flex: 1 }}
            />
            <Field
              label="Cupo *"
              value={t.cupo}
              onChangeText={(v) => updateTipo(t.key, 'cupo', soloDigitos(v))}
              keyboardType="number-pad"
              error={errTipo(t.key).cupo}
              style={{ flex: 1 }}
            />
          </View>
        </Card>
      ))}
      <Button
        title="Agregar tipo de entrada"
        icon="add"
        variant="secondary"
        onPress={() => setTipos((prev) => [...prev, nuevoTipo()])}
      />

      <Button title="Publicar evento" icon="cloud-upload-outline" onPress={crear} busy={busy} style={{ marginTop: 24 }} />
      <Text style={styles.hint}>* Campos obligatorios</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 16, marginBottom: 8, fontWeight: '800', fontSize: 18, color: colors.text },
  label: { fontWeight: '600', marginBottom: 6, color: colors.text, fontSize: 15 },
  hint: { color: colors.muted, marginBottom: 8, marginTop: 4 },
  error: { color: colors.danger, fontWeight: '600', marginBottom: 8, fontSize: 13 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  row2: { flexDirection: 'row', gap: 12 },
  imgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 12 },
  preview: { width: 56, height: 56, borderRadius: radius.sm, backgroundColor: '#e2e8f0' },
  previewPh: { alignItems: 'center', justifyContent: 'center' },
  iconBtn: { width: MIN_TOUCH, height: MIN_TOUCH, alignItems: 'center', justifyContent: 'center' },
  tipoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  tipoTitle: { fontWeight: '800', color: colors.text, fontSize: 16 },
});
