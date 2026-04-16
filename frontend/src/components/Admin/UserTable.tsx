import { useState } from 'react';
import {
  Pencil,
  Trash2,
  ShieldCheck,
  Search,
  ChevronLeft,
  ChevronRight,
  UserCircle,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import clsx from 'clsx';

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'operator' | 'viewer';
  isActive: boolean;
  twoFactorEnabled: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

interface UserTableProps {
  users: UserRecord[];
  isLoading?: boolean;
  onEdit: (user: UserRecord) => void;
  onDelete: (user: UserRecord) => void;
  onToggleStatus: (user: UserRecord) => void;
}

const roleStyles: Record<string, string> = {
  admin: 'badge-danger',
  operator: 'badge-warning',
  viewer: 'badge-info',
};

const roleLabels: Record<string, string> = {
  admin: 'Admin',
  operator: 'Op\u00e9rateur',
  viewer: 'Observateur',
};

const PAGE_SIZE = 10;

export default function UserTable({
  users,
  isLoading = false,
  onEdit,
  onDelete,
  onToggleStatus,
}: UserTableProps) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [roleFilter, setRole] = useState<string>('all');

  const filtered = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function formatDate(iso?: string) {
    if (!iso) return '\u2014';
    try {
      return format(parseISO(iso), 'dd MMM yyyy, HH:mm', { locale: fr });
    } catch {
      return iso;
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="search"
            placeholder="Rechercher un utilisateur\u2026"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="input-field pl-9"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => { setRole(e.target.value); setPage(1); }}
          className="input-field w-40"
        >
          <option value="all">Tous les r\u00f4les</option>
          <option value="admin">Admin</option>
          <option value="operator">Op\u00e9rateur</option>
          <option value="viewer">Observateur</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="table-base">
          <thead>
            <tr>
              <th>Utilisateur</th>
              <th>Email</th>
              <th>R\u00f4le</th>
              <th>Statut</th>
              <th>2FA</th>
              <th>Derni\u00e8re connexion</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j}>
                      <div className="skeleton h-4 w-full" />
                    </td>
                  ))}
                </tr>
              ))
            ) : paged.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-10 text-slate-400">
                  <UserCircle className="w-10 h-10 mx-auto mb-2 text-slate-200" />
                  Aucun utilisateur trouv\u00e9
                </td>
              </tr>
            ) : (
              paged.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full oasis-gradient flex items-center justify-center text-white text-xs font-semibold shrink-0">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-slate-800">{user.name}</span>
                    </div>
                  </td>
                  <td className="text-slate-600">{user.email}</td>
                  <td>
                    <span className={clsx('badge', roleStyles[user.role])}>
                      {roleLabels[user.role]}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => onToggleStatus(user)}
                      className={clsx(
                        'badge cursor-pointer transition-colors',
                        user.isActive
                          ? 'badge-success hover:bg-red-100 hover:text-red-700'
                          : 'badge-neutral hover:bg-oasis-100 hover:text-oasis-700'
                      )}
                      title={user.isActive ? 'D\u00e9sactiver' : 'Activer'}
                    >
                      {user.isActive ? 'Actif' : 'Inactif'}
                    </button>
                  </td>
                  <td>
                    {user.twoFactorEnabled ? (
                      <ShieldCheck className="w-4 h-4 text-oasis-600" />
                    ) : (
                      <span className="text-slate-300">\u2014</span>
                    )}
                  </td>
                  <td className="text-slate-500 text-sm">{formatDate(user.lastLoginAt)}</td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEdit(user)}
                        className="p-1.5 rounded-lg hover:bg-oasis-50 text-slate-400 hover:text-oasis-600 transition-colors"
                        title="Modifier"
                        aria-label={`Modifier ${user.name}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(user)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                        title="Supprimer"
                        aria-label={`Supprimer ${user.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>
            {filtered.length} utilisateur(s) \u2014 page {page}/{totalPages}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-40 transition-colors"
              aria-label="Page pr\u00e9c\u00e9dente"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-40 transition-colors"
              aria-label="Page suivante"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
