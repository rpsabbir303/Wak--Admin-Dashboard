import type { Config } from 'tailwindcss'

export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      borderRadius: {
        lg: '10px',
      },
      colors: {
        primary: {
          50: '#f6f1eb',
          100: '#eadbc9',
          200: '#d8bb96',
          300: '#c49b63',
          400: '#aa7440',
          500: '#895129',
          600: '#764421',
          700: '#62371a',
          800: '#4f2b14',
          900: '#3d200e',
          DEFAULT: '#895129',
          foreground: '#ffffff',
        },
        background: '#F8F9FB',
        card: '#FFFFFF',
        border: 'hsl(240 6% 88%)',
        muted: 'hsl(240 6% 96%)',
        foreground: 'hsl(240 10% 10%)',
        'muted-foreground': 'hsl(240 4% 45%)',
      },
      boxShadow: {
        soft: '0 10px 30px rgba(16, 24, 40, 0.06)',
      },
    },
  },
  plugins: [],
} satisfies Config

