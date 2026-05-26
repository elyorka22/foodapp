export const metadata = { title: 'FoodMarket Restaurant' };

export default function RestaurantLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-gray-50">{children}</div>;
}
