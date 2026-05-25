import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./src/**/*.{ts,tsx}', '../../packages/ui/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: { brand: { 50: '#f0fdf4', 100: '#dcfce7', 600: '#16a34a', 700: '#15803d' } },
      boxShadow: { card: '0 1px 3px rgb(0 0 0 / 0.06)' },
    },
  },
  plugins: [],
};
export default config;
