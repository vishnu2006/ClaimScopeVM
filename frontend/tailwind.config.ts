import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary brand - deep professional blue (linked to CSS vars)
        brand: {
          50: 'var(--color-brand-50, #eff6ff)',
          100: 'var(--color-brand-100, #dbeafe)',
          200: 'var(--color-brand-200, #bfdbfe)',
          300: 'var(--color-brand-300, #93c5fd)',
          400: 'var(--color-brand-400, #60a5fa)',
          500: 'var(--color-brand-500, #3b82f6)',
          600: 'var(--color-brand-600, #2563eb)',
          700: 'var(--color-brand-700, #1d4ed8)',
          800: 'var(--color-brand-800, #1e40af)',
          900: 'var(--color-brand-900, #1e3a8a)',
          950: 'var(--color-brand-950, #172554)',
        },
        // Neutral surfaces (linked to CSS vars)
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
        // Status colors (linked to CSS vars)
        status: {
          success: 'var(--color-status-success, #059669)',
          warning: 'var(--color-status-warning, #d97706)',
          error: 'var(--color-status-error, #dc2626)',
          info: 'var(--color-status-info, #2563eb)',
          pending: 'var(--color-status-pending, #8b5cf6)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
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
      },
      boxShadow: {
        '2xs': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'subtle': '0 1px 2px 0 rgb(0 0 0 / 0.03)',
        'card': '0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        'elevated': '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
        'modal': '0 10px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.06)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-in': 'slideIn 0.2s ease-out',
        'pulse-subtle': 'pulseSubtle 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateY(-4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
