import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Compose class names with `clsx` semantics, then dedupe/resolve conflicting
 * Tailwind utilities with `tailwind-merge` (so `cn('p-2', cond && 'p-4')`
 * yields the last-wins `p-4`). The exported signature is unchanged from the
 * earlier dependency-free version, so callers need no edits.
 */
export function cn(...parts: ClassValue[]): string {
  return twMerge(clsx(parts));
}
