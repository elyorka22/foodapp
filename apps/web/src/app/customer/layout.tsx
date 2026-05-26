import { ToastProvider, OfflineBanner } from '@foodmarket/ui';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <OfflineBanner />
      {children}
    </ToastProvider>
  );
}
