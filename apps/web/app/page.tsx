import Link from 'next/link';
import { cn, Card, CardContent, CardHeader, CardTitle } from '@simcoin/ui';

/**
 * Button-styled link. The shared `Button` renders a `<button>`; for navigation
 * we reuse its token classes on a Next `<Link>` instead.
 */
function buttonLinkClass(variant: 'primary' | 'outline' = 'primary'): string {
  return cn(
    'inline-flex h-11 items-center justify-center gap-2 rounded-md px-5 text-sm font-semibold transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    variant === 'primary'
      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
      : 'border border-border bg-transparent hover:bg-secondary/60',
  );
}

/**
 * Marketing landing page (public). Server component — no client interactivity
 * beyond navigation links.
 */
export default function LandingPage() {
  return (
    <main className="mx-auto flex w-full max-w-screen-sm flex-col gap-12 px-4 py-12 sm:max-w-screen-md">
      <Hero />
      <FeatureGrid />
      <CallToAction />
    </main>
  );
}

function Hero() {
  return (
    <section className="flex flex-col items-center gap-6 text-center">
      <span className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
        Real prices · Simulated stakes · Zero risk
      </span>
      <h1 className="text-balance text-4xl font-extrabold leading-tight sm:text-5xl">
        Duolingo for crypto trading
      </h1>
      <p className="max-w-prose text-pretty text-muted-foreground">
        Learn how markets really work by trading simulated assets against real, live
        prices. Climb competitive leagues, master the charts, and earn achievements —
        without ever risking a cent.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link href="/register" className={cn(buttonLinkClass('primary'), 'w-full sm:w-auto')}>
          Start playing free
        </Link>
        <Link href="/login" className={cn(buttonLinkClass('outline'), 'w-full sm:w-auto')}>
          Log in
        </Link>
      </div>
    </section>
  );
}

const FEATURES: Array<{ title: string; body: string }> = [
  {
    title: 'Live market engine',
    body: 'Prices stream from real exchanges. What you see is what the world sees — only the money is fake.',
  },
  {
    title: 'Paper trading',
    body: 'Place market and limit orders, build positions, and track mark-to-market PnL on every trade.',
  },
  {
    title: 'Competitive leagues',
    body: 'Climb from Bronze to Master across 30-day seasons. Top performers promote; the bottom relegate.',
  },
  {
    title: 'Learn by doing',
    body: 'Bite-sized lessons unlock XP and badges as you put each concept to work in the simulator.',
  },
];

function FeatureGrid() {
  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {FEATURES.map((f) => (
        <Card key={f.title}>
          <CardHeader>
            <CardTitle>{f.title}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">{f.body}</CardContent>
        </Card>
      ))}
    </section>
  );
}

function CallToAction() {
  return (
    <section className="flex flex-col items-center gap-4 rounded-lg border border-border bg-card p-8 text-center">
      <h2 className="text-2xl font-bold">Ready to trade your way to the top?</h2>
      <p className="max-w-prose text-sm text-muted-foreground">
        Create a free account, get your starting balance, and place your first trade in
        under a minute.
      </p>
      <Link href="/login" className={buttonLinkClass('primary')}>
        Get started
      </Link>
    </section>
  );
}
