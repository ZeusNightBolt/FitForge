/**
 * Plain (non-client) module for demo id helpers so server code — e.g. `generateStaticParams` —
 * can import their literal values. (Importing values from a `'use client'` module into server
 * code yields client references, not the underlying strings.)
 */
export const DEMO_ROUTINE_ID = 'demo';

export function demoDayId(index: number): string {
  return `demo-day-${index + 1}`;
}
