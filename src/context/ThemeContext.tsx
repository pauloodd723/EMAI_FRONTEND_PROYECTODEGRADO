import React, { createContext, useContext, useState } from 'react';
import { DEFAULT_COLORS } from '../constants';

interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  error: string;
  success: string;
  warning: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  borderLight: string;
}

interface ThemeContextType {
  colors: ThemeColors;
  setInstitutionColors: (primary: string, secondary?: string) => void;
  resetColors: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [colors, setColors] = useState<ThemeColors>(DEFAULT_COLORS);

  const setInstitutionColors = (primary: string, secondary?: string) => {
    // Solo aplica si es un color válido hex
    if (!primary || !primary.startsWith('#')) return;
    setColors((prev) => ({
      ...prev,
      primary,
      secondary: secondary ?? lightenColor(primary, 0.15),
      accent: lightenColor(primary, 0.3),
    }));
  };

  const resetColors = () => {
    setColors(DEFAULT_COLORS);
  };

  return (
    <ThemeContext.Provider value={{ colors, setInstitutionColors, resetColors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme debe usarse dentro de <ThemeProvider>');
  return ctx;
}

function lightenColor(hex: string, amount: number): string {
  try {
    const clean = hex.replace('#', '');
    const num = parseInt(clean, 16);
    const r = Math.min(255, (num >> 16) + Math.round(255 * amount));
    const g = Math.min(255, ((num >> 8) & 0xff) + Math.round(255 * amount));
    const b = Math.min(255, (num & 0xff) + Math.round(255 * amount));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  } catch {
    return hex;
  }
}
