'use client';
import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, XCircle, Info } from 'lucide-react';
import { SPRING } from './motion.js';
import { cn } from './cn.js';

type Tone = 'success' | 'error' | 'info';

export interface ToastOptions {
  title: string;
  description?: string;
  tone?: Tone;
  /** Auto-dismiss after ms (default 3500). */
  duration?: number;
}

interface ToastItem extends ToastOptions {
  id: number;
}

interface ToastContextValue {
  toast: (opts: ToastOptions) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

/** Access the toast dispatcher. Throws if used outside <ToastProvider>. */
export function useToast(): ToastContextValue {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
}

const ICONS: Record<Tone, typeof Info> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

const TONE_CLASS: Record<Tone, string> = {
  success: 'text-primary',
  error: 'text-bear',
  info: 'text-accent',
};

/**
 * Mount once near the app root. Provides `useToast()` and renders the toast
 * stack (top-center, stacked, auto-dismissing) with enter/exit animation.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<ToastItem[]>([]);
  const idRef = React.useRef(0);

  const remove = React.useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = React.useCallback(
    (opts: ToastOptions) => {
      const id = ++idRef.current;
      setItems((prev) => [...prev, { id, ...opts }]);
      const duration = opts.duration ?? 3500;
      setTimeout(() => remove(id), duration);
    },
    [remove],
  );

  const value = React.useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-[calc(env(safe-area-inset-top)+0.75rem)] z-[60] flex flex-col items-center gap-2 px-4">
        <AnimatePresence>
          {items.map((t) => {
            const Icon = ICONS[t.tone ?? 'info'];
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.95 }}
                transition={SPRING}
                onClick={() => remove(t.id)}
                className={cn(
                  'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border border-border',
                  'bg-background-elevated px-4 py-3 shadow-card',
                )}
              >
                <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', TONE_CLASS[t.tone ?? 'info'])} />
                <div className="min-w-0">
                  <p className="font-display text-sm font-bold">{t.title}</p>
                  {t.description ? (
                    <p className="text-xs text-muted-foreground">{t.description}</p>
                  ) : null}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
