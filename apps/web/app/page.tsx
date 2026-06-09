import Link from 'next/link';
import { cn, Card, CardContent, CardHeader, CardTitle, Mascot, Badge } from '@simcoin/ui';

/** Button-styled link (the shared Button renders a <button>; links reuse tokens). */
function buttonLinkClass(variant: 'white' | 'outline' = 'white'): string {
  return cn(
    'inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold transition-transform active:scale-[0.97]',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    variant === 'white'
      ? 'bg-foreground text-background hover:bg-foreground/90 shadow-fab'
      : 'border border-border bg-transparent hover:bg-secondary/60',
  );
}

/** Marketing landing page (public, server-rendered). */
export default function LandingPage() {
  return (
    <main className="mx-auto flex w-full max-w-screen-sm flex-col gap-12 px-5 py-12 sm:max-w-screen-md">
      <Hero />
      <FeatureGrid />
      <CallToAction />
    </main>
  );
}

function Hero() {
  return (
    <section className="flex flex-col items-center gap-6 pt-6 text-center">
      <Mascot mood="happy" size={120} className="drop-shadow-[0_10px_30px_hsl(96_78%_40%/0.35)]" />
      <Badge variant="lime" size="md">
        Real prices · Simulated stakes · Zero risk
      </Badge>
      <h1 className="text-balance font-display text-4xl font-extrabold leading-tight sm:text-5xl">
        World&apos;s most fun way to{' '}
        <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          learn crypto trading
        </span>
      </h1>
      <p className="max-w-prose text-pretty text-muted-foreground">
        Trade simulated assets against real, live prices. Climb competitive leagues, master
        the charts, and earn achievements — without ever risking a cent.
      </p>
      <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
        <Link href="/onboarding" className={cn(buttonLinkClass('white'), 'w-full sm:w-auto')}>
          Get Started
        </Link>
        <Link href="/login" className={cn(buttonLinkClass('outline'), 'w-full sm:w-auto')}>
          Log in
        </Link>
      </div>
    </section>
  );
}

const FEATURES = [
  { emoji: '📈', title: 'Live market engine', body: 'Prices stream from real exchanges. What you see is what the world sees — only the money is fake.' },
  { emoji: '🎮', title: 'Paper trading', body: 'Place market and limit orders, build positions, and track mark-to-market PnL on every trade.' },
  { emoji: '🏆', title: 'Competitive leagues', body: 'Climb from Bronze to Master across 30-day seasons. Top performers promote; the bottom relegate.' },
  { emoji: '🎓', title: 'Learn by doing', body: 'Bite-sized lessons unlock XP and badges as you put each concept to work in the simulator.' },
];

function FeatureGrid() {
  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {FEATURES.map((f) => (
        <Card key={f.title}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span aria-hidden="true">{f.emoji}</span>
              {f.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">{f.body}</CardContent>
        </Card>
      ))}
    </section>
  );
}

function CallToAction() {
  return (
    <section className="flex flex-col items-center gap-4 rounded-2xl border border-primary/20 bg-gradient-to-br from-card to-background-elevated p-8 text-center shadow-card">
      <h2 className="font-display text-2xl font-extrabold">Ready to trade your way to the top?</h2>
      <p className="max-w-prose text-sm text-muted-foreground">
        Create a free account, get your starting balance, and place your first trade in under a minute.
      </p>
      <Link href="/onboarding" className={buttonLinkClass('white')}>
        Get Started
      </Link>
    </section>
  );
}
