import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#1877f2',
          dark: '#166fe5',
          light: '#e7f0fe',
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#1877f2',
          600: '#166fe5',
          700: '#1257b0',
        },
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.04)',
        soft: '0 4px 20px rgba(0,0,0,0.06)',
        pop: '0 8px 30px rgba(24,119,242,0.18)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      keyframes: {
        'pop-in': {
          '0%': { transform: 'scale(0.85)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'fade-up': {
          '0%': { transform: 'translateY(6px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        'pop-in': 'pop-in 0.15s ease-out',
        'fade-up': 'fade-up 0.25s ease-out',
      },
    },
  },
  plugins: [],
};

export default config;
