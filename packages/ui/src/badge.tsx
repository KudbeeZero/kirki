import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './cn.js';

/** Small status/label chip. Full class strings kept static for Tailwind purge. */
const badge = cva(
  'inline-flex items-center gap-1 rounded-full font-semibold leading-none whitespace-nowrap',
  {
    variants: {
      variant: {
        lime: 'bg-primary/15 text-primary',
        gold: 'bg-gold/15 text-gold',
        mint: 'bg-accent/15 text-accent',
        muted: 'bg-muted text-muted-foreground',
        outline: 'border border-border text-foreground',
        bull: 'bg-bull/15 text-bull',
        bear: 'bg-bear/15 text-bear',
      },
      size: {
        sm: 'px-2 py-0.5 text-[10px]',
        md: 'px-2.5 py-1 text-xs',
      },
    },
    defaultVariants: { variant: 'muted', size: 'md' },
  },
);

export type BadgeVariant = NonNullable<VariantProps<typeof badge>['variant']>;

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badge> {}

export function Badge({ className, variant, size, ...props }: BadgeProps) {
  return <span className={cn(badge({ variant, size }), className)} {...props} />;
}
