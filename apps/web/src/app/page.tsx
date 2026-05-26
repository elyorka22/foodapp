import { redirect } from 'next/navigation';
import { CUSTOMER } from '@/lib/paths';

export default function RootPage() {
  redirect(CUSTOMER);
}
