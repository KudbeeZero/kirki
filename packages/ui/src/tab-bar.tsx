'use client';
import * as React from 'react';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { SPRING } from './motion.js';
import { cn } from './cn.js';

export interface TabItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export interface TabBarCenter {
  label: string;
  icon: LucideIcon;
  onPress: () => void;
}

export interface TabBarProps {
  items: TabItem[];
  activeHref: string;
  center: TabBarCenter;
  /** Render prop for the app's <Link>; defaults to <a>. */
  renderLink?: (props: {
    href: string;
    className?: string;
    children: React.ReactNode;
    'aria-current'?: 'page';
  }) => React.ReactNode;
  className?: string;
}

/**
 * Fixed bottom navigation with a raised center FAB (the signature TRADE
 * action). The active tab shows an animated lime pill (shared `layoutId`).
 * Items split evenly around the center button. Safe-area aware.
 */
export function TabBar({ items, activeHref, center, renderLink, className }: TabBarProps) {
  const link =
    renderLink ?? (({ href, className: c, children, ...rest }) => (
      <a href={href} className={c} {...rest}>
        {children}
      </a>
    ));

  const CenterIcon = center.icon;
  const left = items.slice(0, Math.ceil(items.length / 2));
  const right = items.slice(Math.ceil(items.length / 2));

  return (
    <nav
      className={cn(
        'fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 backdrop-blur',
        'pb-[env(safe-area-inset-bottom)]',
        className,
      )}
    >
      <ul className="mx-auto flex w-full max-w-screen-md items-end justify-around px-2">
        {left.map((t) => (
          <Tab key={t.href} item={t} active={t.href === activeHref} renderLink={link} />
        ))}

        <li className="flex flex-1 justify-center">
          <button
            type="button"
            onClick={center.onPress}
            aria-label={center.label}
            className={cn(
              '-mt-6 flex h-16 w-16 items-center justify-center rounded-full',
              'bg-foreground text-background shadow-fab transition-transform active:scale-95',
            )}
          >
            <CenterIcon className="h-7 w-7" strokeWidth={2.5} />
          </button>
        </li>

        {right.map((t) => (
          <Tab key={t.href} item={t} active={t.href === activeHref} renderLink={link} />
        ))}
      </ul>
    </nav>
  );
}

function Tab({
  item,
  active,
  renderLink,
}: {
  item: TabItem;
  active: boolean;
  renderLink: NonNullable<TabBarProps['renderLink']>;
}) {
  const Icon = item.icon;
  return (
    <li className="flex flex-1 justify-center">
      {renderLink({
        href: item.href,
        'aria-current': active ? 'page' : undefined,
        className: cn(
          'relative flex flex-col items-center gap-1 px-2 py-2.5 text-[11px] font-semibold transition-colors',
          active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
        ),
        children: (
          <>
            {active ? (
              <motion.span
                layoutId="tab-pill"
                transition={SPRING}
                className="absolute inset-x-1 top-1 h-8 rounded-full bg-primary/15"
              />
            ) : null}
            <Icon className="relative z-10 h-5 w-5" strokeWidth={active ? 2.5 : 2} />
            <span className="relative z-10">{item.label}</span>
          </>
        ),
      })}
    </li>
  );
}
