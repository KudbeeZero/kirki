import type { Metadata, Viewport } from 'next';
import './globals.css';

/**
 * Root layout for the Simcoin web app.
 *
 * Mobile-first: the viewport is locked to device width, supports notch
 * safe-areas, and the theme is dark by default (set on <html>).
 */
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
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#0a0f1e',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
