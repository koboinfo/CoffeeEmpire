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
        background: '#EAF6FF',
        surface: '#FFFFFF',
        'surface-alt': '#F1F9FF',
        border: '#D3E9F7',
        header: '#FFFFFF',
        roast: '#FF7A1A',
        'roast-dark': '#E0630A',
        'roast-light': '#FF9D4D',
        cream: '#FFF3E0',
        'text-primary': '#1C2B3A',
        'text-secondary': '#5A7086',
        'text-muted': '#93A9BB',
        gold: '#FFC53D',
        sky: '#2BA6E0',
        positive: '#1FAE64',
        negative: '#E5483C',
        'error-bg': '#FFEAE7',
        'error-text': '#C6392C',
        'hud-pill': 'rgba(28,43,58,0.05)',
        'hud-pill-border': 'rgba(28,43,58,0.10)',
        'map-owned': '#1FAE64',
        'map-competitor': '#E5483C',
        'map-vacant': '#9DB2C2',
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
