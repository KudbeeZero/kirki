import type { Config } from 'tailwindcss';

/**
 * Tailwind config for the Simcoin web app.
 *
 * Tokens follow a ShadCN-style HSL CSS-variable theme (see `app/globals.css`)
 * so the shared `@simcoin/ui` components stay consistent across web + admin.
 * The `content` glob includes `@simcoin/ui` so its class names survive purge.
 *
 * Brand: "playful & rounded" forest-green / lime / gold (see docs/design/brand.md).
 */
const config: Config = {
  darkMode: ['class'],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '1rem',
      screens: { '2xl': '1400px' },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: {
          DEFAULT: 'hsl(var(--background))',
          elevated: 'hsl(var(--background-elevated))',
        },
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        gold: {
          DEFAULT: 'hsl(var(--gold))',
          foreground: 'hsl(var(--gold-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // Semantic market colours used by PriceTicker etc.
        bull: 'hsl(var(--bull))',
        bear: 'hsl(var(--bear))',
        // League tier identity (TierBadge crests).
        tier: {
          bronze: 'hsl(var(--tier-bronze))',
          silver: 'hsl(var(--tier-silver))',
          gold: 'hsl(var(--tier-gold))',
          diamond: 'hsl(var(--tier-diamond))',
          master: 'hsl(var(--tier-master))',
        },
      },
      fontFamily: {
        // Wired from next/font in app/layout.tsx.
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'var(--font-sans)', 'ui-sans-serif', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      borderRadius: {
        '2xl': 'calc(var(--radius) + 4px)',
        xl: 'var(--radius)',
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 4px)',
        sm: 'calc(var(--radius) - 8px)',
      },
      backgroundImage: {
        // Forest canvas gradient from the mockup (radial top, deep at the base).
        forest:
          'radial-gradient(120% 80% at 50% 0%, hsl(155 32% 12%) 0%, hsl(155 30% 7%) 55%, hsl(155 34% 5%) 100%)',
        'gold-sheen':
          'linear-gradient(135deg, hsl(46 92% 70%) 0%, hsl(42 88% 60%) 45%, hsl(36 80% 48%) 100%)',
      },
      boxShadow: {
        card: '0 8px 30px hsl(155 40% 3% / 0.5)',
        sheet: '0 -12px 40px hsl(155 40% 3% / 0.55)',
        fab: '0 10px 25px hsl(96 78% 30% / 0.45)',
        glow: '0 0 0 1px hsl(var(--primary) / 0.4), 0 8px 24px hsl(var(--primary) / 0.25)',
      },
      keyframes: {
        'flash-bull': {
          '0%': { backgroundColor: 'hsl(var(--bull) / 0.28)' },
          '100%': { backgroundColor: 'transparent' },
        },
        'flash-bear': {
          '0%': { backgroundColor: 'hsl(var(--bear) / 0.28)' },
          '100%': { backgroundColor: 'transparent' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'flash-bull': 'flash-bull 600ms var(--ease-out)',
        'flash-bear': 'flash-bear 600ms var(--ease-out)',
        shimmer: 'shimmer 1.5s infinite',
      },
    },
  },
  plugins: [],
};

export default config;
