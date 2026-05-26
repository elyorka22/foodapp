import { redirect } from 'next/navigation';
import { REGISTER_PATH } from '@/lib/auth/constants';

export default function CustomerRegisterRedirect() {
  redirect(REGISTER_PATH);
}
