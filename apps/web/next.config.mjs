// @ts-check

/**
 * Next.js configuration for the Simcoin web app.
 *
 * `transpilePackages` lets Next compile our workspace packages (which ship raw
 * TypeScript via their `main`/`exports` pointing at `src/`) without a separate
 * build step during development.
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@simcoin/sdk', '@simcoin/types', '@simcoin/ui'],
  experimental: {
    // Workspace packages are ESM-only TypeScript sources.
    externalDir: true,
  },
};

export default nextConfig;
