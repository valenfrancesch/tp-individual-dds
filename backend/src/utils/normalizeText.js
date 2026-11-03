/**
 * Normaliza texto para búsquedas: minúsculas, sin acentos/diacríticos, espacios colapsados.
 * Ej: "Hamlet en el Colón" → "hamlet en el colon"
 */
export function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export function includesNormalized(haystack, needle) {
  if (!needle) return true;
  return normalizeText(haystack).includes(normalizeText(needle));
}
