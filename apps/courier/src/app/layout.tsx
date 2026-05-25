import './globals.css';
export const metadata = { title: 'Courier — FoodMarket' };
export default function L({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body className="bg-white">{children}</body></html>;
}
