import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ToastProvider, OfflineBanner } from '@foodmarket/ui';
import { AuthProvider } from '@/components/auth/AuthProvider';
import './globals.css';

const inter = Inter({ subsets: ['latin', 'cyrillic'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'FoodMarket — Ovqat va mahsulot yetkazib berish',
  description: "FoodMarket — Toshkent va butun O'zbekiston bo'ylab tez yetkazib berish",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz">
      <body className={`${inter.variable} font-sans min-h-screen antialiased`}>
        <ToastProvider>
          <AuthProvider>
            <OfflineBanner />
            {children}
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
