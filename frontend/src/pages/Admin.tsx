import { useState, useEffect, useCallback } from 'react';
import { Users, UserPlus, RefreshCw, Shield } from 'lucide-react';
import UserTable, { type UserRecord } from '@/components/Admin/UserTable';
import UserForm from '@/components/Admin/UserForm';
import apiClient from '@/utils/api';
import { extractErrorMessage } from '@/services/api.service';

export default function Admin() {
  const [users, setUsers]         = useState<UserRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [editingUser, setEditing] = useState<UserRecord | null | undefined>(undefined);
  /* undefined = modal closed, null = creating new, UserRecord = editing */

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get<{ data: UserRecord[] }>('/admin/users');
      setUsers(data.data);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  async function handleFormSubmit(formData: {
    name: string;
    email: string;
    role: 'admin' | 'operator' | 'viewer';
    isActive: boolean;
    password?: string;
    confirmPassword?: string;
  }) {
    const payload = {
      name:     formData.name,
      email:    formData.email,
      role:     formData.role,
      isActive: formData.isActive,
      ...(formData.password ? { password: formData.password } : {}),
    };

    try {
      if (editingUser) {
        await apiClient.put(`/admin/users/${editingUser.id}`, payload);
      } else {
        await apiClient.post('/admin/users', payload);
      }
      setEditing(undefined);
      await loadUsers();
    } catch (err) {
      throw new Error(extractErrorMessage(err));
    }
  }

  async function handleDelete(user: UserRecord) {
    if (!confirm(`Supprimer l'utilisateur "${user.name}" ? Cette action est irréversible.`)) {
      return;
    }
    try {
      await apiClient.delete(`/admin/users/${user.id}`);
      await loadUsers();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  async function handleToggleStatus(user: UserRecord) {
    try {
      await apiClient.patch(`/admin/users/${user.id}/status`, {
        isActive: !user.isActive,
      });
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, isActive: !u.isActive } : u
        )
      );
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  const statsActive   = users.filter((u) => u.isActive).length;
  const statsAdmin    = users.filter((u) => u.role === 'admin').length;
  const statsOperator = users.filter((u) => u.role === 'operator').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Shield className="w-6 h-6 text-oasis-600" />
            Administration
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Gestion des utilisateurs ·{' '}
            <span className="arabic-inline">إدارة المستخدمين</span>
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => void loadUsers()}
            className="btn-secondary"
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
          <button
            onClick={() => setEditing(null)}
            className="btn-primary"
          >
            <UserPlus className="w-4 h-4" />
            Nouvel utilisateur
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: 'Total utilisateurs',
            labelAr: 'إجمالي المستخدمين',
            value: users.length,
            color: 'border-l-4 border-oasis-500',
          },
          {
            label: 'Actifs',
            labelAr: 'نشطون',
            value: statsActive,
            color: 'border-l-4 border-sky-500',
          },
          {
            label: 'Admins',
            labelAr: 'المديرون',
            value: statsAdmin,
            color: 'border-l-4 border-red-400',
          },
          {
            label: 'Opérateurs',
            labelAr: 'المشغلون',
            value: statsOperator,
            color: 'border-l-4 border-sand-400',
          },
        ].map((s) => (
          <div key={s.label} className={`card ${s.color} py-4`}>
            <p className="text-2xl font-bold text-slate-900">{s.value}</p>
            <p className="text-sm text-slate-500">{s.label}</p>
            <p className="text-xs text-slate-400 arabic-inline">{s.labelAr}</p>
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="card">
        <div className="card-header">
          <h2 className="section-title flex items-center gap-2">
            <Users className="w-4 h-4 text-oasis-600" />
            Utilisateurs
            <span className="text-xs font-normal text-slate-400 arabic-inline">المستخدمون</span>
          </h2>
        </div>
        <UserTable
          users={users}
          isLoading={isLoading}
          onEdit={(user) => setEditing(user)}
          onDelete={handleDelete}
          onToggleStatus={handleToggleStatus}
        />
      </div>

      {/* Modal */}
      {editingUser !== undefined && (
        <UserForm
          user={editingUser}
          onSubmit={handleFormSubmit}
          onCancel={() => setEditing(undefined)}
        />
      )}
    </div>
  );
}
