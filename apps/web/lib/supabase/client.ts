'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@fitforge/shared/types';

/**
 * Browser Supabase client (SSR-cookie aware). Use inside client components and hooks.
 * Typed with the generated `Database` so `.from()` / `.rpc()` are fully checked.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

export type SupabaseBrowserClient = ReturnType<typeof createClient>;
