import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin', 'cyrillic'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'FoodMarket — Ovqat va mahsulot yetkazib berish',
  description: 'FoodMarket — Toshkent va butun O\'zbekiston bo\'ylab tez yetkazib berish',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz">
      <body className={`${inter.variable} font-sans min-h-screen antialiased`}>{children}</body>
    </html>
  );
}
