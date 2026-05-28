import type { Metadata } from 'next';
import { ToastProvider, OfflineBanner } from '@foodmarket/ui';
import { AuthProvider } from '@/components/auth/AuthProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'FoodApp — Ovqat va mahsulot yetkazib berish',
  description: "FoodApp — Toshkent va butun O'zbekiston bo'ylab tez yetkazib berish",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz">
      <body className="font-sans min-h-screen antialiased">
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
