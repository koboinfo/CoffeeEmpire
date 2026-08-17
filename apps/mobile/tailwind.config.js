/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      // apps/mobile/src/theme/theme.ts の colors/spacing/radius と同じ値。
      // 既存StyleSheetベースの画面と新規NativeWind製UIで見た目が食い違わないよう、
      // 値は theme.ts 側を正として手動同期する(自動生成はしていない)。
      colors: {
        background: '#141F29',
        surface: '#1D2C3A',
        'surface-alt': '#26394A',
        border: '#33495A',
        header: '#0F1720',
        roast: '#D9722C',
        'roast-dark': '#B85A1F',
        'roast-light': '#F0955A',
        cream: '#F3E4D0',
        'text-primary': '#F2F0EC',
        'text-secondary': '#9FB0BE',
        'text-muted': '#6B7C89',
        gold: '#E8A23D',
        positive: '#5FBE72',
        negative: '#E2564B',
        'error-bg': '#3A2020',
        'error-text': '#FFB4AC',
        'hud-pill': 'rgba(255,255,255,0.12)',
        'hud-pill-border': 'rgba(255,255,255,0.08)',
        'map-owned': '#5FBE72',
        'map-competitor': '#E2564B',
        'map-vacant': '#6B7C89',
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
      },
      borderRadius: {
        sm: '8px',
        md: '14px',
        lg: '20px',
      },
    },
  },
  plugins: [],
};
