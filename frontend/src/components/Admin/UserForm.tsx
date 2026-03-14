import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Loader2, Save } from 'lucide-react';
import type { UserRecord } from './UserTable';

/* ── Zod schema ──────────────────────────────────────────────────────── */
const userSchema = z
  .object({
    name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').max(80),
    email: z.string().email('Email invalide'),
    role: z.enum(['admin', 'operator', 'viewer']),
    isActive: z.boolean(),
    password: z
      .string()
      .optional()
      .refine(
        (v) => !v || v.length >= 8,
        'Le mot de passe doit contenir au moins 8 caractères'
      ),
    confirmPassword: z.string().optional(),
  })
  .refine(
    (data) => !data.password || data.password === data.confirmPassword,
    {
      message: 'Les mots de passe ne correspondent pas',
      path: ['confirmPassword'],
    }
  );

type UserFormData = z.infer<typeof userSchema>;

interface UserFormProps {
  user?: UserRecord | null;
  onSubmit: (data: UserFormData) => Promise<void>;
  onCancel: () => void;
}

export default function UserForm({ user, onSubmit, onCancel }: UserFormProps) {
  const isEditing = !!user;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name:     user?.name ?? '',
      email:    user?.email ?? '',
      role:     user?.role ?? 'viewer',
      isActive: user?.isActive ?? true,
      password: '',
      confirmPassword: '',
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-slide-in">
        {/* Header */}
        <div className="oasis-gradient px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-white font-semibold">
              {isEditing ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
            </h2>
            <p className="text-oasis-200 text-xs arabic-inline">
              {isEditing ? 'تعديل المستخدم' : 'مستخدم جديد'}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">
              Nom complet <span className="text-slate-400 arabic-inline text-xs">الاسم الكامل</span>
            </label>
            <input
              type="text"
              {...register('name')}
              placeholder="Ahmed Benali"
              className={`input-field ${errors.name ? 'input-error' : ''}`}
            />
            {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">
              Email <span className="text-slate-400 arabic-inline text-xs">البريد الإلكتروني</span>
            </label>
            <input
              type="email"
              {...register('email')}
              placeholder="ahmed@oasis.dz"
              className={`input-field ${errors.email ? 'input-error' : ''}`}
            />
            {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
          </div>

          {/* Role */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">
              Rôle <span className="text-slate-400 arabic-inline text-xs">الدور</span>
            </label>
            <select {...register('role')} className="input-field">
              <option value="viewer">Observateur / مشاهد</option>
              <option value="operator">Opérateur / مشغّل</option>
              <option value="admin">Administrateur / مدير</option>
            </select>
          </div>

          {/* Active toggle */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isActive"
              {...register('isActive')}
              className="w-4 h-4 rounded border-slate-300 text-oasis-600 focus:ring-oasis-500"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-slate-700">
              Compte actif <span className="text-slate-400 arabic-inline text-xs">الحساب نشط</span>
            </label>
          </div>

          {/* Password fields */}
          <div className="pt-2 border-t border-slate-100">
            <p className="text-xs text-slate-500 mb-3">
              {isEditing
                ? 'Laissez vide pour ne pas changer le mot de passe'
                : 'Définir un mot de passe initial'}
            </p>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">
                  Mot de passe <span className="text-slate-400 arabic-inline text-xs">كلمة المرور</span>
                </label>
                <input
                  type="password"
                  {...register('password')}
                  placeholder="••••••••"
                  className={`input-field ${errors.password ? 'input-error' : ''}`}
                />
                {errors.password && (
                  <p className="text-xs text-red-600">{errors.password.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">
                  Confirmer <span className="text-slate-400 arabic-inline text-xs">تأكيد</span>
                </label>
                <input
                  type="password"
                  {...register('confirmPassword')}
                  placeholder="••••••••"
                  className={`input-field ${errors.confirmPassword ? 'input-error' : ''}`}
                />
                {errors.confirmPassword && (
                  <p className="text-xs text-red-600">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="btn-secondary flex-1"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enregistrement…
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {isEditing ? 'Mettre à jour' : 'Créer'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
