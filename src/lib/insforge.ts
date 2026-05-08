const BASE_URL = process.env.INSFORGE_URL!;
const API_KEY = process.env.INSFORGE_API_KEY!;

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${API_KEY}`,
};

export async function dbQuery<T>(
  table: string,
  params: Record<string, string | number> = {}
): Promise<T[]> {
  const query = new URLSearchParams(
    Object.entries(params).map(([k, v]) => [k, String(v)])
  );
  const res = await fetch(`${BASE_URL}/api/database/records/${table}?${query}`, { headers });
  if (!res.ok) throw new Error(`InsForge query error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.records)) return data.records;
  return [];
}

export async function dbInsert<T>(table: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${BASE_URL}/api/database/records/${table}`, {
    method: 'POST',
    headers: { ...headers, Prefer: 'return=representation' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`InsForge insert error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  if (Array.isArray(data) && data.length > 0) return data[0];
  return data;
}

export async function dbUpdate<T>(
  table: string,
  id: string,
  body: Record<string, unknown>
): Promise<T> {
  const res = await fetch(`${BASE_URL}/api/database/records/${table}?id=eq.${id}`, {
    method: 'PATCH',
    headers: { ...headers, Prefer: 'return=representation' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`InsForge update error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  if (Array.isArray(data) && data.length > 0) return data[0];
  return data;
}

export async function dbDelete(table: string, id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/database/records/${table}?id=eq.${id}`, {
    method: 'DELETE',
    headers,
  });
  if (!res.ok) throw new Error(`InsForge delete error ${res.status}: ${await res.text()}`);
}
