import type { Config } from 'tailwindcss';
export default { content: ['./src/**/*.{ts,tsx}', '../../packages/ui/src/**/*.{ts,tsx}'], theme: { extend: { colors: { brand: { 600: '#16a34a' } } } } } satisfies Config;
