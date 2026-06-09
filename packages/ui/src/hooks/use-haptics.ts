'use client';
import * as React from 'react';

type Pattern = 'light' | 'medium' | 'success' | 'error';

const PATTERNS: Record<Pattern, number | number[]> = {
  light: 10,
  medium: 20,
  success: [12, 40, 18],
  error: [30, 40, 30],
};

/**
 * Lightweight haptic feedback via the Vibration API. Feature-detected and
 * silently no-ops where unsupported (notably iOS Safari). Returns a stable
 * `vibrate(pattern)` callback for press/confirm/unlock moments.
 */
export function useHaptics() {
  return React.useCallback((pattern: Pattern = 'light') => {
    if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
    try {
      navigator.vibrate(PATTERNS[pattern]);
    } catch {
      /* unsupported / blocked — ignore */
    }
  }, []);
}
