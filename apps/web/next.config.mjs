// @ts-check

/**
 * Next.js configuration for the Simcoin web app.
 *
 * `transpilePackages` lets Next compile our workspace packages (whose tsconfig
 * `paths` resolve to their `src/`) without a separate build step during
 * development. Those sources use NodeNext-style explicit `.js` import
 * specifiers, so we teach webpack to resolve `./foo.js` → `./foo.ts(x)`.
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@simcoin/sdk', '@simcoin/types', '@simcoin/ui'],
  experimental: {
    // Workspace packages are ESM-only TypeScript sources.
    externalDir: true,
  },
  webpack: (config) => {
    // Resolve NodeNext-style `.js` specifiers in workspace TS sources.
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    };
    return config;
  },
};

export default nextConfig;
