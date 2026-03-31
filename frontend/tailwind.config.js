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
        // Use CSS variables for dynamic theming - using rgb() for opacity support
        bg: {
          0: 'var(--bg-0)',
          1: 'var(--bg-1)',
          2: 'var(--bg-2)',
          3: 'var(--bg-3)',
          4: 'var(--bg-4)',
          5: 'var(--bg-5)',
        },
        border: {
          DEFAULT: 'var(--border-default)',
          hi: 'var(--border-hi)',
        },
        purple: {
          DEFAULT: 'var(--accent-purple)',
          dark: 'var(--accent-purple-dark)',
          light: 'var(--accent-purple)',
        },
        teal: {
          DEFAULT: 'var(--accent-teal)',
          dark: 'var(--accent-teal-dark)',
          deeper: 'var(--accent-teal-dark)',
          light: 'var(--accent-teal)',
        },
        amber: {
          DEFAULT: 'var(--accent-amber)',
          dark: 'var(--accent-amber)',
          light: 'var(--accent-amber)',
        },
        text: {
          0: 'var(--text-0)',
          1: 'var(--text-1)',
          2: 'var(--text-2)',
          3: 'var(--text-3)',
        },
        // RGB colors for opacity variants (fallbacks)
        red: 'rgb(231 76 60 / <alpha-value>)',
        'acpm-primary': 'var(--accent-purple)',
        'acpm-secondary': 'var(--accent-teal)',
      },
      fontFamily: {
        sans: ['Space Grotesk', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'acpm-brand': 'linear-gradient(135deg, var(--accent-purple), var(--accent-teal))',
        'acpm-blue': 'linear-gradient(135deg, var(--accent-purple-dark), var(--accent-teal-dark))',
        'acpm-glow': 'linear-gradient(135deg, rgba(var(--accent-purple-rgb, 127 119 221), 0.2), rgba(var(--accent-teal-rgb, 29 158 117), 0.2))',
      },
      boxShadow: {
        'glow-purple': '0 0 20px rgba(var(--accent-purple-rgb, 127 119 221), 0.3)',
        'glow-teal': '0 0 20px rgba(var(--accent-teal-rgb, 29 158 117), 0.3)',
        'glow-amber': '0 0 12px rgba(var(--accent-amber-rgb, 239 159 39), 0.4)',
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
