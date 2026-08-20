export const colors = {
  background: '#EAF6FF',
  surface: '#FFFFFF',
  surfaceAlt: '#F1F9FF',
  border: '#D3E9F7',
  header: '#FFFFFF',
  roast: '#FF7A1A',
  roastDark: '#E0630A',
  roastLight: '#FF9D4D',
  cream: '#FFF3E0',
  textPrimary: '#1C2B3A',
  textSecondary: '#5A7086',
  textMuted: '#93A9BB',
  gold: '#FFC53D',
  sky: '#2BA6E0',
  positive: '#1FAE64',
  negative: '#E5483C',
  errorBg: '#FFEAE7',
  errorText: '#C6392C',
  white: '#FFFFFF',
  hudPill: 'rgba(28,43,58,0.05)',
  hudPillBorder: 'rgba(28,43,58,0.10)',
  mapOwned: '#1FAE64',
  mapCompetitor: '#E5483C',
  mapVacant: '#9DB2C2',
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
    shadowColor: '#1C2B3A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
} as const;
