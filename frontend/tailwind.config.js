/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ACPM palette — from SVG portada
        bg: {
          0: '#060F1C',   // deepest background
          1: '#0A1628',   // sidebar / panels
          2: '#0D1E38',   // cards
          3: '#111E35',   // elevated cards
          4: '#162240',   // hover states
          5: '#1A2C50',   // borders active
        },
        border: {
          DEFAULT: '#1A2C45',
          hi: '#2A4E72',
        },
        purple: {
          light: '#AFA9EC',
          DEFAULT: '#7F77DD',
          dark: '#534AB7',
        },
        teal: {
          light: '#9FE1CB',
          DEFAULT: '#5DCAA5',
          dark: '#1D9E75',
          deeper: '#0F6E56',
        },
        amber: {
          light: '#FCD34D',
          DEFAULT: '#EF9F27',
          dark: '#BA7517',
        },
        navy: {
          light: '#2A4E72',
          DEFAULT: '#1A3B5A',
          dark: '#1A3A58',
        },
        text: {
          0: '#F0F4FF',
          1: '#B4C5E0',
          2: '#6A8AAE',
          3: '#3A5070',
        },
        red: {
          DEFAULT: '#E74C3C',
          soft: 'rgba(231,76,60,0.15)',
        },
      },
      fontFamily: {
        sans: ['Space Grotesk', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'acpm-brand': 'linear-gradient(135deg, #7F77DD, #1D9E75)',
        'acpm-blue': 'linear-gradient(135deg, #534AB7, #1D9E75)',
        'acpm-glow': 'linear-gradient(135deg, rgba(127,119,221,0.2), rgba(29,158,117,0.2))',
      },
      boxShadow: {
        'glow-purple': '0 0 20px rgba(127,119,221,0.3)',
        'glow-teal': '0 0 20px rgba(29,158,117,0.3)',
        'glow-amber': '0 0 12px rgba(239,159,39,0.4)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-up': 'slideUp 0.25s ease-out',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { transform: 'translateY(8px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
      },
    },
  },
  plugins: [],
};
