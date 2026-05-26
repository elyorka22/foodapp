export const metadata = { title: 'FoodMarket Business' };

export default function BusinessLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-gray-50">{children}</div>;
}
