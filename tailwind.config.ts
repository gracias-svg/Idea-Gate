import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'ig-canvas': 'var(--ig-canvas)',
        'ig-surface': 'var(--ig-surface)',
        'ig-surface-raised': 'var(--ig-surface-raised)',
        'ig-surface-overlay': 'var(--ig-surface-overlay)',
        'ig-border': { subtle: 'var(--ig-border-subtle)', DEFAULT: 'var(--ig-border-default)', strong: 'var(--ig-border-strong)' },
        'ig-emerald': { DEFAULT: 'var(--ig-emerald)', bright: 'var(--ig-emerald-bright)', dim: 'var(--ig-emerald-dim)', muted: 'var(--ig-emerald-muted)' },
        'ig-text': { primary: 'var(--ig-text-primary)', secondary: 'var(--ig-text-secondary)', tertiary: 'var(--ig-text-tertiary)' },
        'ig-caution': 'var(--ig-caution)', 'ig-danger': 'var(--ig-danger)', 'ig-info': 'var(--ig-info)', 'ig-stale': 'var(--ig-stale)',
        'ig-agent': { co:'var(--ig-agent-co)', ps:'var(--ig-agent-ps)', re:'var(--ig-agent-re)', ux:'var(--ig-agent-ux)', ar:'var(--ig-agent-ar)', qa:'var(--ig-agent-qa)' },
      },
      fontFamily: { sans: ['var(--ig-font-sans)'], mono: ['var(--ig-font-mono)'] },
      borderRadius: { sm:'var(--ig-radius-sm)', md:'var(--ig-radius-md)', lg:'var(--ig-radius-lg)', xl:'var(--ig-radius-xl)' },
      boxShadow: { 'ig-1':'var(--ig-elev-1)', 'ig-2':'var(--ig-elev-2)', 'ig-overlay':'var(--ig-elev-overlay)', 'ig-glow':'var(--ig-glow-active)', 'ig-focus':'var(--ig-focus-ring)' },
      spacing: { 'ig-rail':'240px', 'ig-topbar':'52px', 'ig-status':'28px' },
    },
  },
} satisfies Config
