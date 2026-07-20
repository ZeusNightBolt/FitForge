/** @type {import('next').NextConfig} */

// DEMO MODE — fully static, backend-free export (deployable to GitHub Pages).
// `basePath` / `assetPrefix` are driven by NEXT_PUBLIC_BASE_PATH so local dev/build
// uses '' and Pages can build with '/FitForge'.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  trailingSlash: true,
  basePath: basePath || undefined,
  assetPrefix: basePath || undefined,
  // @fitforge/shared is a workspace TS package consumed as source; transpile it.
  transpilePackages: ['@fitforge/shared'],
  images: {
    // static export can't run the Next image optimizer.
    unoptimized: true,
  },
};

export default nextConfig;
