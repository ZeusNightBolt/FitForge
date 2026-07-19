/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // @fitforge/shared is a workspace TS package consumed as source; transpile it.
  transpilePackages: ['@fitforge/shared'],
  experimental: {
    // Server Actions / typedRoutes stay default; nothing exotic needed for the MVP scaffold.
  },
  images: {
    // exercise-media / progress-photos live on Supabase Storage; allow remote loader by default.
    remotePatterns: [{ protocol: 'https', hostname: '**.supabase.co' }],
  },
};

export default nextConfig;
