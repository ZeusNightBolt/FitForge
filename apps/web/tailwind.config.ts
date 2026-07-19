import type { Config } from 'tailwindcss';

/**
 * Tailwind v4 auto-detects content and reads design tokens from the `@theme` block in
 * `app/globals.css`. This config is kept intentionally minimal (v4 needs no JS config) and exists
 * so the content globs are explicit and the file is present per the blueprint monorepo tree (§8).
 */
const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
};

export default config;
