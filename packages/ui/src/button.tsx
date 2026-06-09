import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './cn.js';

/**
 * Button — the primary tappable surface. Variants/sizes map to shared Tailwind
 * tokens via `cva`. Full class strings are listed statically so Tailwind purge
 * keeps them. `tone` adds bull/sell intents; `fab` is the round center action.
 */
const button = cva(
  cn(
    'inline-flex items-center justify-center gap-2 font-display font-semibold',
    'transition-[transform,background-color,box-shadow] duration-150 active:scale-[0.97]',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    'disabled:pointer-events-none disabled:opacity-50 select-none',
  ),
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-fab',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        outline: 'border border-border bg-transparent hover:bg-secondary/60',
        ghost: 'bg-transparent hover:bg-secondary/60',
        gold: 'bg-gold text-gold-foreground hover:bg-gold/90',
        bull: 'bg-bull text-primary-foreground hover:bg-bull/90',
        bear: 'bg-bear text-white hover:bg-bear/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        white: 'bg-foreground text-background hover:bg-foreground/90',
      },
      size: {
        sm: 'h-9 rounded-lg px-3 text-sm',
        md: 'h-11 rounded-xl px-5 text-sm',
        lg: 'h-12 rounded-2xl px-6 text-base',
        pill: 'h-11 rounded-full px-6 text-sm',
        icon: 'h-11 w-11 rounded-full',
        fab: 'h-16 w-16 rounded-full text-base',
      },
      block: { true: 'w-full' },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export type ButtonVariant = NonNullable<VariantProps<typeof button>['variant']>;
export type ButtonSize = NonNullable<VariantProps<typeof button>['size']>;

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof button> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, block, ...props }, ref) => (
    <button ref={ref} className={cn(button({ variant, size, block }), className)} {...props} />
  ),
);
Button.displayName = 'Button';
