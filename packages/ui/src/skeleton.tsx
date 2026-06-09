import * as React from 'react';
import { cn } from './cn.js';

/**
 * Shimmer placeholder for async content. Pure CSS (the `shimmer` keyframe is
 * defined in the app's tailwind config), so it stays server-renderable.
 */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl bg-muted/60',
        'after:absolute after:inset-0 after:-translate-x-full after:animate-shimmer',
        'after:bg-gradient-to-r after:from-transparent after:via-foreground/10 after:to-transparent',
        className,
      )}
      aria-hidden="true"
      {...props}
    />
  );
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={cn('h-4', i === lines - 1 ? 'w-2/3' : 'w-full')} />
      ))}
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-2xl border border-border bg-card p-4', className)}>
      <Skeleton className="h-6 w-1/2" />
      <Skeleton className="mt-3 h-10 w-3/4" />
      <SkeletonText className="mt-4" lines={2} />
    </div>
  );
}
