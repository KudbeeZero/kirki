/**
 * Minimal className combiner. Filters falsy values and joins with spaces.
 *
 * The real design system layers `clsx` + `tailwind-merge`; this dependency-free
 * version keeps the package buildable before those are installed.
 */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}
