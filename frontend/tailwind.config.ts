import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ValueMomentum inspired brand colors: Deep Navy, Precision Blue, Forest/Growth Green, Innovation Amber
        brand: {
          50: 'var(--color-brand-50, #f0f6ff)',
          100: 'var(--color-brand-100, #e0eeff)',
          200: 'var(--color-brand-200, #b9dbfe)',
          300: 'var(--color-brand-300, #7cb9fd)',
          400: 'var(--color-brand-400, #3694fc)',
          500: 'var(--color-brand-500, #086afc)', // ValueMomentum Electric Cobalt
          600: 'var(--color-brand-600, #0056d6)',
          700: 'var(--color-brand-700, #0045ad)',
          800: 'var(--color-brand-800, #033a8c)',
          900: 'var(--color-brand-900, #0a1f44)', // Deep Enterprise P&C Navy
          950: 'var(--color-brand-950, #061329)',
        },
        growth: {
          50: '#f2fbf0',
          100: '#e1f7dd',
          200: '#c5efbd',
          300: '#9acf84',
          400: '#75be5a',
          500: '#5eba46', // ValueMomentum Momentum Green
          600: '#469b30',
          700: '#387a27',
          800: '#2f6123',
          900: '#285120',
        },
        accent: {
          amber: '#febc10', // ValueMomentum Innovation Gold/Amber
          navy: '#0b192e',
        },
        // Neutral surfaces (Corporate editorial slate & warm charcoal)
        surface: {
          0: 'var(--color-surface-0, #ffffff)',
          50: 'var(--color-surface-50, #f8fafc)',
          100: 'var(--color-surface-100, #f1f5f9)',
          200: 'var(--color-surface-200, #e2e8f0)',
          300: 'var(--color-surface-300, #cbd5e1)',
          400: 'var(--color-surface-400, #94a3b8)',
          500: 'var(--color-surface-500, #64748b)',
          600: 'var(--color-surface-600, #475569)',
          700: 'var(--color-surface-700, #334155)',
          800: 'var(--color-surface-800, #1e293b)',
          900: 'var(--color-surface-900, #0f172a)',
          950: 'var(--color-surface-950, #020617)',
        },
        // Status colors
        status: {
          success: 'var(--color-status-success, #2e7d32)',
          warning: 'var(--color-status-warning, #d97706)',
          error: 'var(--color-status-error, #c62828)',
          info: 'var(--color-status-info, #086afc)',
          pending: 'var(--color-status-pending, #6366f1)',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '0.9375rem' }],
        'xs': ['0.8125rem', { lineHeight: '1.1875rem' }],
        'sm': ['0.875rem', { lineHeight: '1.375rem' }],
        'base': ['0.9375rem', { lineHeight: '1.5rem' }],
        'lg': ['1.0625rem', { lineHeight: '1.625rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.75rem' }],
        '5xl': ['3rem', { lineHeight: '1.15' }],
        '6xl': ['3.75rem', { lineHeight: '1.1' }],
      },
      spacing: {
        '4.5': '1.125rem',
        '13': '3.25rem',
        '15': '3.75rem',
        '18': '4.5rem',
        'sidebar': '280px',
      },
      borderRadius: {
        'sm': '0.25rem',
        'md': '0.375rem',
        'lg': '0.5rem',
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        '2xs': '0 1px 2px 0 rgb(0 0 0 / 0.04)',
        'subtle': '0 1px 3px 0 rgb(15 23 42 / 0.05), 0 1px 2px -1px rgb(15 23 42 / 0.03)',
        'card': '0 2px 5px -1px rgb(15 23 42 / 0.06), 0 1px 3px -1px rgb(15 23 42 / 0.04)',
        'elevated': '0 10px 25px -5px rgb(15 23 42 / 0.08), 0 8px 10px -6px rgb(15 23 42 / 0.04)',
        'modal': '0 20px 40px -10px rgb(15 23 42 / 0.16), 0 10px 15px -5px rgb(15 23 42 / 0.08)',
      },
    },
  },
  plugins: [],
};

export default config;
