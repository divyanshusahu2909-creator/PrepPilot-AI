/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Semantic theme tokens (switch with .dark on <html>)
        base: 'rgb(var(--c-bg) / <alpha-value>)',
        surface: 'rgb(var(--c-surface) / <alpha-value>)',
        'surface-2': 'rgb(var(--c-surface-2) / <alpha-value>)',
        line: 'rgb(var(--c-border) / <alpha-value>)',
        ink: 'rgb(var(--c-text) / <alpha-value>)',
        muted: 'rgb(var(--c-muted) / <alpha-value>)',

        // Warm neutral backbone
        graphite: {
          50: '#f7f5f0',
          100: '#efece5',
          200: '#dedcd4',
          300: '#c2beb3',
          400: '#9a968b',
          500: '#747a80',
          600: '#5a6067',
          700: '#3e444b',
          800: '#2a2f36',
          900: '#20252d',
          950: '#14181d',
        },

        // Primary accent — pine. Adapts contrast between light and dark modes.
        accent: {
          100: 'rgb(var(--c-accent-100) / <alpha-value>)',
          200: 'rgb(var(--c-accent-200) / <alpha-value>)',
          300: 'rgb(var(--c-accent-300) / <alpha-value>)',
          400: 'rgb(var(--c-accent-400) / <alpha-value>)',
          500: 'rgb(var(--c-accent-500) / <alpha-value>)',
          600: 'rgb(var(--c-accent-600) / <alpha-value>)',
          700: 'rgb(var(--c-accent-700) / <alpha-value>)',
          800: 'rgb(var(--c-accent-800) / <alpha-value>)',
          900: 'rgb(var(--c-accent-900) / <alpha-value>)',
        },

        // Explicit brand ramps for new work
        pine: {
          50: '#eef4f1',
          100: '#dce8e3',
          200: '#c7d8cf',
          300: '#a6c1b5',
          400: '#6fa79c',
          500: '#2f6f68',
          600: '#265a54',
          700: '#1e4a45',
          800: '#183b37',
          900: '#122c29',
          DEFAULT: '#2f6f68',
        },
        clay: {
          50: '#fbf0eb',
          100: '#f6ded4',
          200: '#efc3b1',
          300: '#e5a088',
          400: '#d97757',
          500: '#c4603f',
          600: '#a64d30',
          700: '#833c26',
          800: '#5f2c1c',
          900: '#3f1e14',
          DEFAULT: '#d97757',
        },
        sage: {
          100: '#eaf1ed',
          200: '#dce6df',
          300: '#c7d8cf',
          400: '#a6c1b5',
          500: '#7fa396',
          DEFAULT: '#dce6df',
        },
        paper: '#f7f5f0',
        sand: '#eceae3',
      },
      borderRadius: {
        sm: '0.125rem',
        DEFAULT: '0.1875rem',
        md: '0.25rem',
        lg: '0.375rem',
        xl: '0.5rem',
        '2xl': '0.625rem',
        '3xl': '0.75rem',
      },
      fontFamily: {
        sans: ['DM Sans', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Manrope', 'DM Sans', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(32, 37, 45, 0.04), 0 1px 3px rgba(32, 37, 45, 0.05)',
        lift: '0 14px 34px -18px rgba(32, 37, 45, 0.28)',
        paper: '0 1px 0 rgba(32, 37, 45, 0.05)',
      },
      backgroundImage: {
        'grid-pattern':
          'linear-gradient(to right, rgb(var(--c-border) / 0.55) 1px, transparent 1px), linear-gradient(to bottom, rgb(var(--c-border) / 0.55) 1px, transparent 1px)',
        'accent-line': 'linear-gradient(90deg, #2f6f68 0%, #d97757 100%)',
      },
      backgroundSize: {
        'grid-sm': '28px 28px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        float: 'float 7s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
      },
    },
  },
  plugins: [],
};
