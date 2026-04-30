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
        primary: '#895129',
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

