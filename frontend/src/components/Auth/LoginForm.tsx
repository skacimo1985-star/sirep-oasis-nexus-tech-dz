import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { loginApi } from '@/services/auth.service';
import { extractErrorMessage } from '@/services/api.service';

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'L\'email est requis')
    .email('Adresse email invalide'),
  password: z
    .string()
    .min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
  totpCode: z
    .string()
    .optional()
    .refine(
      (v) => !v || /^\d{6}$/.test(v),
      'Le code 2FA doit contenir 6 chiffres'
    ),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const { login } = useAuthStore();
  const navigate    = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError]   = useState<string | null>(null);
  const [requires2FA, setRequires2FA]   = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(values: LoginFormData) {
    setServerError(null);
    try {
      const response = await loginApi({
        email:    values.email,
        password: values.password,
        totpCode: values.totpCode,
      });

      if (response.requiresTwoFactor && !values.totpCode) {
        setRequires2FA(true);
        return;
      }

      login(response.user, response.accessToken, response.refreshToken);
      navigate('/dashboard');
    } catch (err) {
      setServerError(extractErrorMessage(err));
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-5"
      noValidate
    >
      {/* Server error */}
      {serverError && (
        <div
          role="alert"
          className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
        >
          {serverError}
        </div>
      )}

      {/* Email */}
      <div className="space-y-1.5">
        <label htmlFor="email" className="block text-sm font-medium text-slate-700">
          Adresse email
          <span className="ml-2 text-slate-400 arabic-inline text-xs">البريد الإلكتروني</span>
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="admin@oasis.dz"
          {...register('email')}
          className={`input-field ${errors.email ? 'input-error' : ''}`}
        />
        {errors.email && (
          <p className="text-xs text-red-600">{errors.email.message}</p>
        )}
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <label htmlFor="password" className="block text-sm font-medium text-slate-700">
          Mot de passe
          <span className="ml-2 text-slate-400 arabic-inline text-xs">كلمة المرور</span>
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="••••••••"
            {...register('password')}
            className={`input-field pr-10 ${errors.password ? 'input-error' : ''}`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((p) => !p)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            aria-label={showPassword ? 'Masquer' : 'Afficher'}
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>
        {errors.password && (
          <p className="text-xs text-red-600">{errors.password.message}</p>
        )}
      </div>

      {/* 2FA code — shown only when server indicates it's required */}
      {requires2FA && (
        <div className="space-y-1.5 animate-fade-in">
          <label
            htmlFor="totpCode"
            className="flex items-center gap-2 text-sm font-medium text-slate-700"
          >
            <ShieldCheck className="w-4 h-4 text-oasis-600" />
            Code d&apos;authentification 2FA
            <span className="text-slate-400 arabic-inline text-xs">رمز التحقق</span>
          </label>
          <input
            id="totpCode"
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="123456"
            {...register('totpCode')}
            className={`input-field tracking-widest text-center text-lg font-mono ${
              errors.totpCode ? 'input-error' : ''
            }`}
          />
          {errors.totpCode && (
            <p className="text-xs text-red-600">{errors.totpCode.message}</p>
          )}
          <p className="text-xs text-slate-500">
            Entrez le code à 6 chiffres de votre application d&apos;authentification.
          </p>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="btn-primary w-full py-2.5"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Connexion en cours…
          </>
        ) : (
          <>Se connecter / تسجيل الدخول</>
        )}
      </button>
    </form>
  );
}
