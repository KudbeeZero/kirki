import * as React from 'react';
import { cn } from './cn.js';

export interface AvatarProps {
  src?: string | null;
  /** Handle/name — drives the initials fallback and alt text. */
  handle: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZES = {
  sm: 'h-7 w-7 text-[10px]',
  md: 'h-10 w-10 text-sm',
  lg: 'h-16 w-16 text-xl',
} as const;

function initials(handle: string): string {
  const clean = handle.replace(/^@/, '').trim();
  return clean.slice(0, 2).toUpperCase() || '?';
}

/** Round avatar with a deterministic initials fallback when no image is set. */
export function Avatar({ src, handle, size = 'md', className }: AvatarProps) {
  const base = cn('shrink-0 overflow-hidden rounded-full', SIZES[size], className);
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={`@${handle}`} className={cn(base, 'object-cover')} />
    );
  }
  return (
    <span
      className={cn(
        base,
        'flex items-center justify-center bg-secondary font-display font-bold text-secondary-foreground',
      )}
      aria-label={`@${handle}`}
    >
      {initials(handle)}
    </span>
  );
}
