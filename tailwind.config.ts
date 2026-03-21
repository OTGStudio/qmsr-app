import type { Config } from 'tailwindcss'

export default {
  theme: {
    extend: {
      colors: {
        brand: {
          bg: 'var(--brand-bg)',
          card: 'var(--brand-card)',
          'card-alt': 'var(--brand-card-alt)',
          border: 'var(--brand-border)',
          text: 'var(--brand-text)',
          muted: 'var(--brand-muted)',
          accent: 'var(--brand-accent)',
          'accent-bg': 'var(--brand-accent-bg)',
          'accent-border': 'var(--brand-accent-border)',
          'warn-bg': 'var(--brand-warn-bg)',
          'warn-border': 'var(--brand-warn-border)',
          'warn-text': 'var(--brand-warn-text)',
          'partial-bg': 'var(--brand-partial-bg)',
          'partial-border': 'var(--brand-partial-border)',
          'partial-text': 'var(--brand-partial-text)',
          'good-bg': 'var(--brand-good-bg)',
          'good-border': 'var(--brand-good-border)',
          'good-text': 'var(--brand-good-text)',
        },
      },
      fontFamily: {
        sans: [
          'Inter Variable',
          'Inter',
          'ui-sans-serif',
          'system-ui',
          'sans-serif',
        ],
        serif: ['Georgia', 'ui-serif', 'serif'],
      },
    },
  },
} satisfies Config
