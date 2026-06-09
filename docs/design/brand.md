# Simcoin Brand & Design System

Simcoin is **"Duolingo for crypto trading"** — a friendly, mobile-first trading
*game*. The brand is **playful & rounded**: approachable, energetic, App-Store
polished. Real markets, fake stakes, real fun.

Assets live in [`docs/design/assets/`](./assets/): `logo-coin-mascot.jpeg`
(the green smiley-coin mascot) and `app-mockup-mobile.jpeg` (the north-star UI).

## Voice

Warm, encouraging, never finance-stuffy. Greets you ("Good Morning, Alex :)"),
celebrates wins, nudges gently on empty states. Teaches without condescending.

## Color

Tokens are HSL channels in `apps/web/app/globals.css` (dark/forest is default).

| Token | HSL | Use |
|-------|-----|-----|
| `--background` | `155 30% 7%` | Deep forest canvas (use `bg-forest` gradient) |
| `--card` | `156 26% 11%` | Lifted surfaces |
| `--primary` (lime) | `96 78% 56%` | Brand accent, primary CTAs, bull/up |
| `--accent` (mint) | `150 60% 60%` | Soft highlights, links |
| `--gold` | `42 88% 60%` | Coins, season ring, premium — **large surfaces/numerals only** |
| `--bull` / `--bear` | lime / `2 78% 60%` | Up / down |
| `--tier-*` | bronze→master | League crests |
| `--radius` | `1rem` | Generous, soft corners |

**Contrast rule:** lime-on-forest and dark-on-lime pass AA. Reserve gold for
large numerals/badges — never small body text.

## Typography

Via `next/font` (self-hosted, zero CLS):
- **Plus Jakarta Sans** → `font-display`: headings, greetings, big balance.
- **Inter** → `font-sans`: body/UI.
- **mono + `tabular-nums`** → prices and any aligned figures.

## Motion

Shared timing language (`globals.css` vars + `packages/ui/src/motion.ts`):
durations `--dur-fast 120ms` / `--dur 200ms` / `--dur-slow 320ms` /
`--dur-celebrate 700ms`; easing `--ease-out cubic-bezier(.16,1,.3,1)`; framer
spring `{stiffness:380, damping:30}`. Animate **transform/opacity only**. Always
honor `prefers-reduced-motion` (springs → fades). Signature moments: balance
odometer, price-flash, season-ring draw, achievement celebration, XP level-up.

## Mascot

The green smiley coin is our personality. Use it in onboarding, empty states
("No positions yet — tap TRADE"), loading spinners (pull-to-refresh), and
celebrations (happy bounce on achievement unlock). Moods: `idle | happy | sad |
celebrate`.

## Layout & components

Mobile-first, `max-w-screen-md`, safe-area aware. Bottom `TabBar`:
Home · Watchlist · **center TRADE FAB** · Orders · Profile. Trading happens in a
draggable bottom-sheet `OrderTicket`, not a separate page. Game state is always
visible: tier crest, season countdown, XP, streak.

## Elevation

`shadow-card` (rest), `shadow-sheet` (bottom sheets), `shadow-fab` (the lime
center button), `shadow-glow` (focus/active lime ring).
