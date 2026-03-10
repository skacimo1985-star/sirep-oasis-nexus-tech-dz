import apiClient from '@/utils/api';
import type { AuthUser } from '@/store/authStore';

export interface LoginCredentials {
  email: string;
  password: string;
  totpCode?: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role?: 'admin' | 'operator' | 'viewer';
}

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  requiresTwoFactor?: boolean;
}

export interface TwoFactorSetupResponse {
  qrCode: string;
  secret: string;
}

/* ── Auth API calls ──────────────────────────────────────────────────── */

export async function loginApi(
  credentials: LoginCredentials
): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>(
    '/auth/login',
    credentials
  );
  return data;
}

export async function registerApi(
  payload: RegisterPayload
): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>(
    '/auth/register',
    payload
  );
  return data;
}

export async function logoutApi(): Promise<void> {
  await apiClient.post('/auth/logout');
}

export async function refreshTokenApi(
  refreshToken: string
): Promise<{ accessToken: string }> {
  const { data } = await apiClient.post<{ accessToken: string }>(
    '/auth/refresh',
    { refreshToken }
  );
  return data;
}

export async function getMeApi(): Promise<AuthUser> {
  const { data } = await apiClient.get<{ data: AuthUser }>('/auth/me');
  return data.data;
}

export async function changePasswordApi(payload: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  await apiClient.post('/auth/change-password', payload);
}

export async function setupTwoFactorApi(): Promise<TwoFactorSetupResponse> {
  const { data } = await apiClient.post<TwoFactorSetupResponse>(
    '/auth/2fa/setup'
  );
  return data;
}

export async function verifyTwoFactorApi(code: string): Promise<void> {
  await apiClient.post('/auth/2fa/verify', { code });
}

export async function disableTwoFactorApi(code: string): Promise<void> {
  await apiClient.post('/auth/2fa/disable', { code });
}

export async function forgotPasswordApi(email: string): Promise<void> {
  await apiClient.post('/auth/forgot-password', { email });
}

export async function resetPasswordApi(payload: {
  token: string;
  newPassword: string;
}): Promise<void> {
  await apiClient.post('/auth/reset-password', payload);
}
