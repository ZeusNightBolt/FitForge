import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { Database } from '@fitforge/shared/types';

type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * Server Supabase client for Server Components, Route Handlers and Server Actions.
 * Reads/writes the auth cookies via Next's async `cookies()` store.
 *
 * In a pure Server Component (read-only render) the cookie `set` calls throw; we swallow that —
 * token refresh is handled by `middleware.ts` on every request.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component render — safe to ignore (middleware refreshes cookies).
          }
        },
      },
    },
  );
}
