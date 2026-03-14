const ACCESS_TOKEN_KEY  = 'sirep_access_token';
const REFRESH_TOKEN_KEY = 'sirep_refresh_token';
const USER_KEY          = 'sirep_user';

/* ── Access Token ────────────────────────────────────────────────────── */
export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function removeAccessToken(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
}

/* ── Refresh Token ───────────────────────────────────────────────────── */
export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setRefreshToken(token: string): void {
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
}

export function removeRefreshToken(): void {
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

/* ── Persisted User ──────────────────────────────────────────────────── */
export interface PersistedUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'operator' | 'viewer';
}

export function getPersistedUser(): PersistedUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as PersistedUser) : null;
  } catch {
    return null;
  }
}

export function setPersistedUser(user: PersistedUser): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function removePersistedUser(): void {
  localStorage.removeItem(USER_KEY);
}

/* ── Clear Everything ────────────────────────────────────────────────── */
export function clearTokens(): void {
  removeAccessToken();
  removeRefreshToken();
  removePersistedUser();
}

/* ── Token Expiry Check ──────────────────────────────────────────────── */
export function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

export function isAuthenticated(): boolean {
  const token = getAccessToken();
  if (!token) return false;
  return !isTokenExpired(token);
}
