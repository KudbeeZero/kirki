/**
 * @simcoin/ui — shared React component library (ShadCN-based).
 *
 * Consumed by apps/web and apps/admin. Components are presentational and
 * typed against @simcoin/types so the design system never drifts from the
 * domain model. Styling relies on the shared Tailwind/CSS-variable tokens
 * that each app declares in its `globals.css`.
 */
export { cn } from './cn.js';
export { Button } from './button.js';
export type { ButtonProps, ButtonVariant, ButtonSize } from './button.js';
export { Card, CardHeader, CardTitle, CardContent } from './card.js';
export { Stat } from './stat.js';
export type { StatProps } from './stat.js';
export { PriceTicker } from './price-ticker.js';
export type { PriceTickerProps } from './price-ticker.js';
export { LeaderboardRow } from './leaderboard-row.js';
export type { LeaderboardRowProps } from './leaderboard-row.js';
