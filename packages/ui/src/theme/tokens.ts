/**
 * Central design tokens. Everything visual in the app derives from here, so the
 * designer's system can be dropped in by editing this one file (and passing a
 * custom theme to <ThemeProvider>) without touching any screen.
 */
export const tokens = {
  color: {
    background: '#ffffff',
    surface: '#f8fafc',
    text: '#0f172a',
    textMuted: '#64748b',
    border: '#e2e8f0',
    primary: '#4f46e5',
    primaryText: '#ffffff',
    danger: '#ef4444',
    success: '#22c55e',
    warning: '#f59e0b',
  },
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 },
  radius: { sm: 6, md: 10, lg: 16, pill: 999 },
  fontSize: { xs: 12, sm: 14, md: 16, lg: 20, xl: 28 },
  fontWeight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
} as const;

export type Tokens = typeof tokens;
