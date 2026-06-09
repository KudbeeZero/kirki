import type { Metadata } from 'next';
import './globals.css';

/**
 * Root layout for the Simcoin admin console.
 *
 * Internal tool — desktop-first, dark theme, and explicitly marked
 * non-indexable. Access is expected to be gated by the gateway to staff with an
 * `admin`/`moderator` role (see @simcoin/types AppRole); enforcing that gate is
 * a TODO until the admin SDK namespace lands.
 */
export const metadata: Metadata = {
  title: { default: 'Simcoin Admin', template: '%s · Simcoin Admin' },
  description: 'Internal operations console for Simcoin.',
  robots: { index: false, follow: false },
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
