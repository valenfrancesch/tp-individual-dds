export function formatFechaDDMMYYYY(iso, { withTime = false } = {}) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  if (!withTime) return `${dd}/${mm}/${yyyy}`;
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
}

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

/** Fecha legible para lectores de pantalla: "21 de noviembre de 2026, 21:00". */
export function formatFechaLarga(iso, { withTime = true } = {}) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const base = `${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
  if (!withTime) return base;
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${base}, ${hh}:${min}`;
}

export function formatMoney(value) {
  return `$${Number(value || 0).toLocaleString('es-AR')}`;
}

export function labelPuntaje(puntaje, cantidadResenias) {
  if (puntaje == null || !cantidadResenias) return 'Sin reseñas';
  return `★ ${Number(puntaje).toFixed(1)} (${cantidadResenias})`;
}

export function a11yPuntaje(puntaje, cantidadResenias) {
  if (puntaje == null || !cantidadResenias) return 'Organizador sin reseñas';
  const n = cantidadResenias === 1 ? '1 reseña' : `${cantidadResenias} reseñas`;
  return `Puntaje del organizador ${Number(puntaje).toFixed(1)} de 5, ${n}`;
}

export function textoDiasRestantes(dias) {
  if (dias == null) return '';
  if (dias < 0) return 'El evento ya pasó';
  if (dias === 0) return '¡Es hoy!';
  if (dias === 1) return 'Falta 1 día';
  return `Faltan ${dias} días`;
}

export function plural(n, singular, pluralForm = `${singular}s`) {
  return `${n} ${n === 1 ? singular : pluralForm}`;
}
