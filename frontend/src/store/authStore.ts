import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  setAccessToken,
  setRefreshToken,
  setPersistedUser,
  clearTokens,
  type PersistedUser,
} from '@/utils/auth';

export interface AuthUser extends PersistedUser {
  twoFactorEnabled?: boolean;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (user: AuthUser, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  updateUser: (partial: Partial<AuthUser>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      /* ── Initial state ──────────────────────────────────────────── */
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      /* ── Actions ─────────────────────────────────────────────────── */
      login: (user, accessToken, refreshToken) => {
        setAccessToken(accessToken);
        setRefreshToken(refreshToken);
        setPersistedUser(user);
        set({
          user,
          accessToken,
          isAuthenticated: true,
          error: null,
          isLoading: false,
        });
      },

      logout: () => {
        clearTokens();
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
          error: null,
          isLoading: false,
        });
      },

      updateUser: (partial) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...partial } : null,
        })),

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      clearError: () => set({ error: null }),
    }),
    {
      name: 'sirep-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

/* ── Selectors ────────────────────────────────────────────────────────── */
export const selectUser = (s: AuthStore) => s.user;
export const selectIsAuthenticated = (s: AuthStore) => s.isAuthenticated;
export const selectIsAdmin = (s: AuthStore) => s.user?.role === 'admin';
export const selectIsOperator = (s: AuthStore) =>
  s.user?.role === 'admin' || s.user?.role === 'operator';
