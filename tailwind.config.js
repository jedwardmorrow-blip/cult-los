/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Bebas Neue"', 'sans-serif'],
        body: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        cult: {
          black: '#0A0A0A',
          dark: '#111111',
          card: '#161616',
          border: '#222222',
          muted: '#2A2A2A',
          text: '#A0A0A0',
          white: '#F0F0F0',
          gold: '#C8A84B',
          'gold-dim': '#8B7235',
          green: '#2D6A4F',
          'green-bright': '#52B788',
          red: '#7B2D2D',
          'red-bright': '#E07070',
          amber: '#7A5C00',
          'amber-bright': '#F0B429',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
}