'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ApiError } from '@simcoin/sdk';
import type { RegisterRequest } from '@simcoin/types';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@simcoin/ui';
import { api, adoptSession } from '@/lib/api';
import { Field } from '../login/page';

/**
 * Registration screen.
 *
 * `auth.register` creates the account, sets the httpOnly refresh cookie, and
 * returns an access token we keep in memory via {@link adoptSession}. We then
 * drop the new player straight into the dashboard.
 */
export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState<RegisterRequest>({ email: '', password: '', handle: '' });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await api.auth.register(form);
      adoptSession(result); // access token -> in-memory store; cookie set by server
      router.push('/dashboard');
    } catch (err) {
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
          <CardTitle className="text-xl">Create your account</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={onSubmit}>
            <Field
              label="Handle"
              autoComplete="username"
              value={form.handle}
              onChange={(handle) => setForm((f) => ({ ...f, handle }))}
              required
            />
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
              autoComplete="new-password"
              value={form.password}
              onChange={(password) => setForm((f) => ({ ...f, password }))}
              required
            />
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Creating account…' : 'Create account'}
            </Button>
          </form>
        </CardContent>
      </Card>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Log in
        </Link>
      </p>
    </main>
  );
}
