const BASE_URL = process.env.INSFORGE_URL!;

export interface InsforgeUser {
  id: string;
  email: string;
  profile?: { name?: string };
  metadata?: Record<string, unknown>;
}

export async function insforgeSignIn(
  email: string,
  password: string
): Promise<{ accessToken: string; user: InsforgeUser } | null> {
  const res = await fetch(`${BASE_URL}/api/auth/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (!data.accessToken) return null;
  return { accessToken: data.accessToken, user: data.user };
}

export async function insforgeSignOut(accessToken: string): Promise<void> {
  await fetch(`${BASE_URL}/api/auth/logout`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${accessToken}` },
  }).catch(() => {});
}

export async function insforgeGetUser(accessToken: string): Promise<InsforgeUser | null> {
  const res = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.user ?? data ?? null;
}

export async function insforgeSignUp(
  email: string,
  password: string,
  name: string
): Promise<{ accessToken?: string; user?: InsforgeUser } | null> {
  const res = await fetch(`${BASE_URL}/api/auth/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
  });
  if (!res.ok) return null;
  return res.json();
}
