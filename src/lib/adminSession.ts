export const ADMIN_TOKEN_KEY = 'nsagpt_admin_token';

export function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.sessionStorage.getItem(ADMIN_TOKEN_KEY);
}

export function clearAdminToken() {
  if (typeof window !== 'undefined') window.sessionStorage.removeItem(ADMIN_TOKEN_KEY);
}
