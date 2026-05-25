import type { NextConfig } from 'next';
const nextConfig: NextConfig = { output: 'standalone', transpilePackages: ['@foodmarket/ui'] };
export default nextConfig;
