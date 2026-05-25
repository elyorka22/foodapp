import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ToastProvider, OfflineBanner } from '@foodmarket/ui';
import './globals.css';

const inter = Inter({ subsets: ['latin', 'cyrillic'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'FoodMarket — Ovqat va mahsulot yetkazish',
  description: 'Toshkent bo\'ylab restoranlar va do\'konlardan tez yetkazib berish',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz">
      <body className={`${inter.variable} font-sans min-h-screen`}>
        <ToastProvider>
          <OfflineBanner />
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
