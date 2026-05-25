import type { NextConfig } from 'next';
export default { output: 'standalone', transpilePackages: ['@foodmarket/ui', '@foodmarket/shared-types'] } satisfies NextConfig;
