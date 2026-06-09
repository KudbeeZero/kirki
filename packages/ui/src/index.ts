/**
 * @simcoin/ui — shared React component library (ShadCN-based, "playful &
 * rounded" brand). Consumed by apps/web and apps/admin. Pure primitives are
 * server-renderable; components needing browser APIs/framer carry their own
 * 'use client' directive. Typed against @simcoin/types so the design system
 * never drifts from the domain model. See docs/design/brand.md.
 */

// Utilities & motion
export { cn } from './cn.js';
export * as motion from './motion.js';

// Layout / text
export { Card, CardHeader, CardTitle, CardContent } from './card.js';
export { Stat } from './stat.js';
export type { StatProps } from './stat.js';

// Controls
export { Button } from './button.js';
export type { ButtonProps, ButtonVariant, ButtonSize } from './button.js';

// Pure primitives (batch 1)
export { Skeleton, SkeletonText, SkeletonCard } from './skeleton.js';
export { Badge } from './badge.js';
export type { BadgeProps, BadgeVariant } from './badge.js';
export { Avatar } from './avatar.js';
export type { AvatarProps } from './avatar.js';
export { CoinIcon } from './coin-icon.js';
export type { CoinIconProps, CoinSymbol } from './coin-icon.js';
export { Mascot } from './mascot.js';
export type { MascotProps, MascotMood } from './mascot.js';
export { Sparkline } from './sparkline.js';
export type { SparklineProps } from './sparkline.js';
export { ProgressBar } from './progress-bar.js';
export type { ProgressBarProps } from './progress-bar.js';
export { ProgressRing } from './progress-ring.js';
export type { ProgressRingProps } from './progress-ring.js';
export { TierBadge } from './tier-badge.js';
export type { TierBadgeProps } from './tier-badge.js';

// Client shell / interactive (each carries its own 'use client')
export { TabBar } from './tab-bar.js';
export type { TabBarProps, TabItem, TabBarCenter } from './tab-bar.js';
export { BottomSheet } from './bottom-sheet.js';
export type { BottomSheetProps } from './bottom-sheet.js';
export { ToastProvider, useToast } from './toast.js';
export type { ToastOptions } from './toast.js';
export { SegmentedControl } from './segmented-control.js';
export type { SegmentedControlProps, SegmentOption } from './segmented-control.js';
export { AnimatedNumber } from './animated-number.js';
export type { AnimatedNumberProps } from './animated-number.js';

export { OrderTicket } from './order-ticket.js';
export type { OrderTicketProps } from './order-ticket.js';
export { CelebrationOverlay } from './celebration.js';
export type { CelebrationOverlayProps } from './celebration.js';
export { XPBar } from './xp-bar.js';
export type { XPBarProps } from './xp-bar.js';
export { PullToRefresh } from './pull-to-refresh.js';
export type { PullToRefreshProps } from './pull-to-refresh.js';

// Hooks
export { useHaptics } from './hooks/use-haptics.js';
export { usePrev } from './hooks/use-prev.js';

// Domain components
export { PriceTicker } from './price-ticker.js';
export type { PriceTickerProps } from './price-ticker.js';
export { LeaderboardRow } from './leaderboard-row.js';
export type { LeaderboardRowProps } from './leaderboard-row.js';
