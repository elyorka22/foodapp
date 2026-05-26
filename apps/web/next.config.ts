import path from 'path';
import type { NextConfig } from 'next';

/** Trace dependencies from monorepo root so standalone output is complete in Docker. */
const monorepoRoot = path.join(__dirname, '../..');

const nextConfig: NextConfig = {
  output: 'standalone',
  outputFileTracingRoot: monorepoRoot,
  transpilePackages: ['@foodmarket/ui', '@foodmarket/shared-types'],
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
};

export default nextConfig;
