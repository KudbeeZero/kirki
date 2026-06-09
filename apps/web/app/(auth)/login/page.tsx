'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ApiError } from '@simcoin/sdk';
import type { LoginRequest } from '@simcoin/types';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@simcoin/ui';
import { api, adoptSession } from '@/lib/api';

/**
 * Login screen.
 *
 * On submit we call the SDK's `auth.login`, which posts credentials and (on the
 * web) receives the refresh token as an httpOnly cookie from the gateway. The
 * returned access token is kept **in memory** via {@link adoptSession} — never
 * persisted to localStorage — then we navigate into the app.
 */
export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState<LoginRequest>({ email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await api.auth.login(form);
      adoptSession(result); // access token -> in-memory store
      router.push('/dashboard');
    } catch (err) {
      // The MFA flow would surface here as a specific code; TODO: render an
      // mfaCode field when the API returns MFA_REQUIRED.
      setError(
        err instanceof ApiError ? err.message : 'Something went wrong. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-6 px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Welcome back</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={onSubmit}>
            <Field
              label="Email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(email) => setForm((f) => ({ ...f, email }))}
              required
            />
            <Field
              label="Password"
              type="password"
              autoComplete="current-password"
              value={form.password}
              onChange={(password) => setForm((f) => ({ ...f, password }))}
              required
            />
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Logging in…' : 'Log in'}
            </Button>
          </form>
        </CardContent>
      </Card>
      <p className="text-center text-sm text-muted-foreground">
        New to Simcoin?{' '}
        <Link href="/register" className="font-medium text-primary hover:underline">
          Create an account
        </Link>
      </p>
    </main>
  );
}

/** Small labelled text input used by the auth forms. */
export function Field({
  label,
  value,
  onChange,
  type = 'text',
  ...rest
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'>) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium">{label}</span>
      <input
        className="h-11 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        {...rest}
      />
    </label>
  );
}
