import { redirect } from 'next/navigation';
import { PROFILE_PATH } from '@/lib/auth/constants';

export default function AccountRedirectPage() {
  redirect(PROFILE_PATH);
}
