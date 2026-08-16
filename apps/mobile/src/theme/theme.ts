export const colors = {
  background: '#141F29',
  surface: '#1D2C3A',
  surfaceAlt: '#26394A',
  border: '#33495A',
  header: '#0F1720',
  roast: '#D9722C',
  roastDark: '#B85A1F',
  roastLight: '#F0955A',
  cream: '#F3E4D0',
  textPrimary: '#F2F0EC',
  textSecondary: '#9FB0BE',
  textMuted: '#6B7C89',
  gold: '#E8A23D',
  positive: '#5FBE72',
  negative: '#E2564B',
  errorBg: '#3A2020',
  errorText: '#FFB4AC',
  white: '#FFFFFF',
  hudPill: 'rgba(255,255,255,0.12)',
  hudPillBorder: 'rgba(255,255,255,0.08)',
  mapOwned: '#5FBE72',
  mapCompetitor: '#E2564B',
  mapVacant: '#6B7C89',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  pill: 999,
} as const;

export const typography = {
  title: { fontSize: 20, fontWeight: '700' as const },
  label: { fontSize: 13, fontWeight: '500' as const },
  value: { fontSize: 26, fontWeight: '800' as const },
  body: { fontSize: 15, fontWeight: '500' as const },
  button: { fontSize: 16, fontWeight: '700' as const },
};

export const shadow = {
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 3,
  },
} as const;
