'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button, Sheet } from '@/components/ui';
import { SparkleIcon, InfoIcon } from '@/components/ui/icons';
import { ensureSession, isOnboarded } from '@/lib/demo/store';

export interface AuthPanelProps {
  /** where to land after starting Local Mode (default: onboarding). */
  next?: string;
}

/**
 * Local Mode entry (§5.1/§5.3). No account, no upload: "Start in Local Mode" seeds a local
 * session and routes onward — to `/today` if onboarding is already complete, otherwise to `next`.
 *
 * Internal identifiers are frozen (§5.1): the CTA keeps `data-testid="enter-demo"` and the store
 * key `fitforge.demo.v1`. Only the user-facing copy is Local Mode.
 */
export function AuthPanel({ next = '/onboarding/goals' }: AuthPanelProps) {
  const router = useRouter();
  const [entering, setEntering] = React.useState(false);
  const [explain, setExplain] = React.useState(false);

  const enter = () => {
    setEntering(true);
    ensureSession();
    router.push(isOnboarded() ? '/today' : next);
  };

  return (
    <div className="space-y-4">
      <Button size="lg" block glow loading={entering} onClick={enter} data-testid="enter-demo">
        <SparkleIcon size={18} /> Start in Local Mode
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Free. No account. Your data stays in this browser.{' '}
        <button
          type="button"
          onClick={() => setExplain(true)}
          className="inline-flex items-center gap-1 font-semibold text-accent hover:underline"
        >
          <InfoIcon size={14} /> What&apos;s this?
        </button>
      </p>

      <Sheet open={explain} onClose={() => setExplain(false)} title="Local Mode">
        <p className="text-sm text-muted-foreground">
          Local Mode keeps everything — your plan, logs, and meals — in this browser&apos;s storage.
          Nothing is uploaded. Export a backup anytime from Settings.
        </p>
        <div className="mt-4">
          <Button block variant="secondary" onClick={() => setExplain(false)}>
            Got it
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
