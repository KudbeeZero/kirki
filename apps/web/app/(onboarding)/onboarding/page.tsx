'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Mascot, TierBadge, ProgressRing, CoinIcon } from '@simcoin/ui';

/**
 * First-run onboarding carousel — three swipeable, mascot-led cards that sell
 * the loop (trade → compete → learn), ending in a CTA to register. Pure client;
 * uses framer for slide + drag-to-advance.
 */
const SLIDES = [
  {
    art: <Mascot mood="happy" size={132} />,
    title: 'Trade real markets, fake money',
    body: 'Buy and sell BTC, ETH, SOL and more against real, live prices. Start with $100,000 in practice cash.',
  },
  {
    art: (
      <div className="flex items-end gap-2">
        <TierBadge tier="bronze" size="lg" />
        <TierBadge tier="gold" size="lg" />
        <TierBadge tier="master" size="lg" />
      </div>
    ),
    title: 'Climb the leagues',
    body: 'Compete in 30-day seasons. Rise from Bronze to Master, top the leaderboards, and earn crests.',
  },
  {
    art: (
      <ProgressRing value={0.7} size={120} tone="gold">
        <span className="font-display text-2xl font-extrabold">+XP</span>
      </ProgressRing>
    ),
    title: 'Learn as you play',
    body: 'Bite-sized lessons turn into XP and badges the moment you use them in the simulator.',
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [i, setI] = React.useState(0);
  const last = i === SLIDES.length - 1;
  const slide = SLIDES[i]!;

  const next = () => (last ? router.push('/register') : setI((v) => v + 1));

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-screen-sm flex-col px-6 py-10">
      <div className="flex justify-end">
        <Link href="/register" className="text-sm font-medium text-muted-foreground">
          Skip
        </Link>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={i}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={(_, info) => {
              if (info.offset.x < -80) next();
              else if (info.offset.x > 80 && i > 0) setI((v) => v - 1);
            }}
            className="flex flex-col items-center gap-8"
          >
            <div className="flex h-44 items-center justify-center">{slide.art}</div>
            <div className="flex flex-col gap-3">
              <h1 className="font-display text-3xl font-extrabold">{slide.title}</h1>
              <p className="text-pretty text-muted-foreground">{slide.body}</p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dots */}
      <div className="mb-6 flex justify-center gap-2">
        {SLIDES.map((_, idx) => (
          <span
            key={idx}
            className={`h-2 rounded-full transition-all ${idx === i ? 'w-6 bg-primary' : 'w-2 bg-muted'}`}
          />
        ))}
      </div>

      <Button onClick={next} size="lg" block>
        {last ? 'Start playing' : 'Next'}
      </Button>
      <p className="mt-3 flex items-center justify-center gap-1 text-center text-xs text-muted-foreground">
        <CoinIcon symbol="BTC" size="sm" className="!h-4 !w-4 !text-[8px]" />
        No real money — ever.
      </p>
    </main>
  );
}
