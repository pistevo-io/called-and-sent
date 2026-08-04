import { authClient } from '../auth/auth';

export type ThemePreference = 'dark' | 'light';

export interface UserProfile {
  id: string;
  user_id: string;
  username: string;
  display_name: string;
  photo_url?: string | null;
  bio?: string | null;
  testimony?: string | null;
  location?: string | null;
  church?: string | null;
  instagram_url?: string | null;
  facebook_url?: string | null;
  website_url?: string | null;
  giving_url?: string | null;
  theme: ThemePreference;
  is_public: boolean;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  image?: string | null;
}

export interface SettingsResponse {
  user: AuthUser;
  profile: UserProfile | null;
}

async function bearerToken(): Promise<string | null> {
  const { data } = await authClient.getSession();
  return data?.session?.token ?? null;
}

async function authedFetch(
  url: string,
  options: RequestInit,
): Promise<{ ok: boolean; status: number; body: any }> {
  const token = await bearerToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(url, { ...options, headers });
  let body: any = null;
  try {
    body = await res.json();
  } catch {
    // Non-JSON responses are fine; we surface status only.
  }
  return { ok: res.ok, status: res.status, body };
}

export async function fetchSettings(): Promise<SettingsResponse> {
  const { ok, body } = await authedFetch('/api/settings', { method: 'GET' });
  if (!ok) {
    throw new Error(body?.error || 'Failed to load settings');
  }
  return body as SettingsResponse;
}

export async function updateProfile(
  fields: Partial<UserProfile>,
): Promise<{ profile: UserProfile; user: AuthUser }> {
  const { ok, body } = await authedFetch('/api/settings', {
    method: 'PUT',
    body: JSON.stringify(fields),
  });
  if (!ok) {
    throw new Error(body?.error || 'Failed to update profile');
  }
  return body as { profile: UserProfile; user: AuthUser };
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<{ success: boolean }> {
  const { ok, body } = await authedFetch('/api/settings/password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  if (!ok) {
    throw new Error(body?.error || 'Failed to change password');
  }
  return body as { success: boolean };
}

export async function updateTheme(theme: ThemePreference): Promise<{ theme: ThemePreference }> {
  const { ok, body } = await authedFetch('/api/settings/theme', {
    method: 'PUT',
    body: JSON.stringify({ theme }),
  });
  if (!ok) {
    throw new Error(body?.error || 'Failed to update theme');
  }
  return body as { theme: ThemePreference };
}
