'use client';

import { useState } from 'react';
import { Button, Input } from '@foodmarket/ui';
import { apiClient } from '@/lib/api';
import { MobileShell } from '@/components/MobileShell';

export default function AccountPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function login() {
    try {
      const res = await apiClient.login(email, password);
      localStorage.setItem('accessToken', res.accessToken);
      alert('Logged in!');
    } catch {
      alert('Login failed. Try admin@foodmarket.local / Password123!');
    }
  }

  return (
    <MobileShell>
      <div className="px-4 py-6 pb-28 max-w-md mx-auto">
        <h1 className="text-xl font-bold">Account</h1>
        <p className="text-gray-500 text-sm mt-1">Optional sign-in or continue as guest</p>

        <div className="mt-8 space-y-4">
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="customer@foodmarket.local" />
          <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <Button fullWidth onClick={login}>Sign in</Button>
        </div>

        <div className="mt-8 p-4 bg-gray-50 rounded-2xl text-sm text-gray-600">
          <p className="font-medium text-gray-900">Demo accounts</p>
          <ul className="mt-2 space-y-1">
            <li>customer@foodmarket.local</li>
            <li>admin@foodmarket.local</li>
            <li>Password: Password123!</li>
          </ul>
        </div>
      </div>
    </MobileShell>
  );
}
