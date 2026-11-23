/**
 * Paleta con contraste WCAG AA (≥ 4.5:1) para texto sobre `bg` y `card`.
 * `muted` se oscureció (#64748b → #475569) porque quedaba al límite.
 */
export const colors = {
  bg: '#f8fafc',
  card: '#ffffff',
  text: '#0f172a',
  muted: '#475569',
  primary: '#0f766e',
  primaryDark: '#115e59',
  primarySoft: '#ccfbf1',
  border: '#cbd5e1',
  danger: '#b91c1c',
  dangerSoft: '#fee2e2',
  warning: '#92400e',
  star: '#b45309',
  focus: '#2563eb',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};

/** Tamaño mínimo de área táctil recomendado (iOS HIG / Material: 44–48). */
export const MIN_TOUCH = 44;

export const radius = {
  sm: 8,
  md: 12,
  pill: 999,
};
