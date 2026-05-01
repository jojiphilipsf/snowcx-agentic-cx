const PROXY = process.env.SF_PROXY_URL || "http://localhost:3001";

export async function query<T = Record<string, unknown>>(sql: string): Promise<T[]> {
  const res = await fetch(PROXY, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sql }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error((err as Record<string, string>).error || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T[]>;
}

const cache = new Map<string, { data: unknown; ts: number }>();

export async function cachedQuery<T = Record<string, unknown>>(sql: string, ttl = 30000): Promise<T[]> {
  const hit = cache.get(sql);
  if (hit && Date.now() - hit.ts < ttl) return hit.data as T[];
  const result = await query<T>(sql);
  cache.set(sql, { data: result, ts: Date.now() });
  if (cache.size > 200) {
    const oldest = [...cache.entries()].sort((a, b) => a[1].ts - b[1].ts)[0];
    if (oldest) cache.delete(oldest[0]);
  }
  return result;
}

export const DB = process.env.SNOWFLAKE_DB_SCHEMA || "TELECOM_CX.DATA";
