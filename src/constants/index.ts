// ─── VERSIÓN ──────────────────────────────────────────────────────────────────
export const APP_VERSION = '1.0.0';
export const APP_NAME = 'EMAI-APP';

// ─── COLORES POR DEFECTO (se sobreescriben con los de la institución) ─────────
export const DEFAULT_COLORS = {
  primary: '#1A3C5E',       // Azul institucional por defecto
  secondary: '#2E6DA4',
  accent: '#4A9FE0',
  background: '#F5F7FA',
  surface: '#FFFFFF',
  error: '#D93025',
  success: '#1E8C4E',
  warning: '#F5A623',
  textPrimary: '#1A1A2E',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
};

// ─── GRADE THRESHOLDS ────────────────────────────────────────────────────────
export const PASSING_GRADE = 3.0;
export const MAX_GRADE = 5.0;
export const MIN_GRADE = 1.0;

// ─── REFRESH INTERVAL (30 segundos) ──────────────────────────────────────────
export const AUTO_REFRESH_INTERVAL = 30_000;

// ─── STORAGE KEYS ────────────────────────────────────────────────────────────
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'emai_auth_token',
  USER_DATA: 'emai_user_data',
  INSTITUTION: 'emai_institution',
  THEME: 'emai_theme',
};

// ─── API ──────────────────────────────────────────────────────────────────────
export const API_BASE_URL = 'https://emaibackendproyectodegrado-production.up.railway.app/api/v1';

// ─── ROLES INTERNOS DIRECTIVO ─────────────────────────────────────────────────
export const DIRECTIVO_SUB_ROLES = [
  { value: 'director', label: 'Director' },
  { value: 'subdirector', label: 'Subdirector' },
  { value: 'coordinador', label: 'Coordinador' },
  { value: 'psicologo', label: 'Psicólogo' },
  { value: 'otro', label: 'Otro' },
] as const;

// ─── EXAM OCR ─────────────────────────────────────────────────────────────────
export const MAX_EXAM_IMAGES = 3;
