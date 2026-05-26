'use client';

import { useEffect, useState } from 'react';
import { Button, Input, Sidebar } from '@foodmarket/ui';
import { t } from '@/i18n';
import { apiClient, type AdminUserRow } from '@/lib/api';
import { getAuthToken, useAuthStore } from '@/store/auth';
import { useAdminNav } from '@/lib/hooks/use-admin-nav';
import { hasPermission } from '@/lib/auth/rbac';

const STAFF_ROLES = ['ADMIN', 'MANAGER', 'OPERATOR', 'COURIER'];
const ALL_ROLES = [...STAFF_ROLES, 'CUSTOMER', 'RESTAURANT_OWNER', 'BUSINESS_OWNER'];

export default function AdminUsersPage() {
  const nav = useAdminNav();
  const permissions = useAuthStore((s) => s.permissions);
  const canManageRoles = hasPermission(permissions, 'manage_roles');
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [staffForm, setStaffForm] = useState({
    email: '',
    password: '',
    role: 'OPERATOR',
    firstName: '',
  });
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const token = getAuthToken();

  async function loadUsers() {
    if (!token) return;
    setLoading(true);
    try {
      const res = await apiClient.adminUsers(token);
      setUsers(res.items);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadUsers();
  }, [token]);

  async function createStaff(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    const res = await apiClient.createStaff(token, staffForm);
    setTempPassword(res.temporaryPassword);
    setStaffForm({ email: '', password: '', role: 'OPERATOR', firstName: '' });
    await loadUsers();
  }

  async function deactivate(userId: string) {
    if (!token) return;
    await apiClient.deactivateUser(token, userId);
    await loadUsers();
  }

  async function assignRole(userId: string, role: string) {
    if (!token) return;
    await apiClient.assignUserRole(token, userId, role);
    await loadUsers();
  }

  return (
    <div className="min-h-screen md:pl-64">
      <Sidebar title={t('roles.admin')} items={nav} accent="FoodMarket UZ" />
      <main className="p-6 md:p-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold">{t('admin.users.title')}</h1>
          <p className="text-gray-500 mt-1">{t('admin.users.subtitle')}</p>
        </div>

        <form onSubmit={createStaff} className="bg-white rounded-xl border p-5 space-y-3 max-w-lg">
          <h2 className="font-semibold">{t('admin.users.createStaff')}</h2>
          <Input
            label={t('auth.email')}
            value={staffForm.email}
            onChange={(e) => setStaffForm((f) => ({ ...f, email: e.target.value }))}
          />
          <Input
            label={t('auth.password')}
            type="password"
            value={staffForm.password}
            onChange={(e) => setStaffForm((f) => ({ ...f, password: e.target.value }))}
          />
          <Input
            label={t('auth.name')}
            value={staffForm.firstName}
            onChange={(e) => setStaffForm((f) => ({ ...f, firstName: e.target.value }))}
          />
          <label className="block text-sm">
            <span className="text-gray-600">{t('admin.users.role')}</span>
            <select
              className="mt-1 w-full border rounded-lg px-3 py-2"
              value={staffForm.role}
              onChange={(e) => setStaffForm((f) => ({ ...f, role: e.target.value }))}
            >
              {STAFF_ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </label>
          <Button type="submit">{t('admin.users.create')}</Button>
          {tempPassword && (
            <p className="text-sm text-amber-700 bg-amber-50 p-3 rounded-lg">
              {t('admin.users.tempPassword')}: <strong>{tempPassword}</strong>
            </p>
          )}
        </form>

        <section className="bg-white rounded-xl border overflow-hidden">
          {loading ? (
            <p className="p-6 text-gray-500">{t('common.loading')}</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="p-3">{t('auth.email')}</th>
                  <th className="p-3">{t('admin.users.role')}</th>
                  <th className="p-3">{t('admin.users.status')}</th>
                  <th className="p-3">{t('admin.users.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-t">
                    <td className="p-3">{user.email ?? '—'}</td>
                    <td className="p-3">
                      {canManageRoles ? (
                        <select
                          className="border rounded px-2 py-1"
                          value={user.role.name}
                          onChange={(e) => void assignRole(user.id, e.target.value)}
                        >
                          {ALL_ROLES.map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </select>
                      ) : (
                        user.role.name
                      )}
                    </td>
                    <td className="p-3">{user.isActive ? t('admin.users.active') : t('admin.users.inactive')}</td>
                    <td className="p-3">
                      {user.isActive && (
                        <Button size="sm" variant="secondary" onClick={() => void deactivate(user.id)}>
                          {t('admin.users.deactivate')}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </main>
    </div>
  );
}
