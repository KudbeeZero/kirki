import type { Metadata, Viewport } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

/**
 * Root layout for the Simcoin web app.
 *
 * Mobile-first: the viewport is locked to device width, supports notch
 * safe-areas, and the theme is dark (forest) by default (set on <html>).
 * Fonts are self-hosted via next/font (zero layout shift, SSR-safe):
 *   - Plus Jakarta Sans → friendly-rounded display (headings, big numbers)
 *   - Inter            → body/UI text
 */
const sans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const display = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-display',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Simcoin — Duolingo for crypto trading',
    template: '%s · Simcoin',
  },
  description:
    'Learn to trade crypto with zero risk. Trade simulated assets against real, ' +
    'live prices, climb the leagues, and master the markets.',
  applicationName: 'Simcoin',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Simcoin',
  },
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/icon.svg' }],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#0f1f17', // forest green — matches the brand canvas
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`dark ${sans.variable} ${display.variable}`}>
      <body className="min-h-dvh bg-forest font-sans">{children}</body>
    </html>
  );
}
