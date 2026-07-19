'use client';

import * as React from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui';

export interface AuthPanelProps {
  /** where to land after a successful sign-in (default: onboarding). */
  next?: string;
}

/**
 * Email magic-link + Google OAuth sign-in (§2.2 screen 1 / §8 login page).
 * Shared by the standalone /login page and the onboarding `auth` step.
 */
export function AuthPanel({ next = '/onboarding/goals' }: AuthPanelProps) {
  const supabase = React.useMemo(() => createClient(), []);
  const [email, setEmail] = React.useState('');
  const [status, setStatus] = React.useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [message, setMessage] = React.useState<string | null>(null);

  const redirectTo = React.useCallback(() => {
    const base =
      process.env.NEXT_PUBLIC_SITE_URL ??
      (typeof window !== 'undefined' ? window.location.origin : '');
    return `${base}/auth/callback?next=${encodeURIComponent(next)}`;
  }, [next]);

  const sendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus('sending');
    setMessage(null);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirectTo() },
    });
    if (error) {
      setStatus('error');
      setMessage(error.message);
    } else {
      setStatus('sent');
      setMessage(`Check ${email.trim()} for your sign-in link.`);
    }
  };

  const signInWithGoogle = async () => {
    setMessage(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: redirectTo() },
    });
    if (error) {
      setStatus('error');
      setMessage(error.message);
    }
  };

  return (
    <div className="space-y-4">
      <Button variant="secondary" size="lg" block onClick={signInWithGoogle} data-testid="google-signin">
        <span aria-hidden>{'\u{1F310}'}</span> Continue with Google
      </Button>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        or
        <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={sendMagicLink} className="space-y-3">
        <label className="block text-sm font-medium text-foreground" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="h-12 w-full rounded-2xl border border-border bg-surface-2 px-4 text-base text-foreground outline-none focus:ring-2 focus:ring-accent"
        />
        <Button
          type="submit"
          size="lg"
          block
          loading={status === 'sending'}
          disabled={status === 'sent'}
          data-testid="magic-link-submit"
        >
          {status === 'sent' ? 'Link sent' : 'Send magic link'}
        </Button>
      </form>

      {message && (
        <p
          role={status === 'error' ? 'alert' : 'status'}
          className={status === 'error' ? 'text-sm text-danger' : 'text-sm text-muted-foreground'}
        >
          {message}
        </p>
      )}
    </div>
  );
}
