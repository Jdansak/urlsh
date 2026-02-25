import { put, list } from '@vercel/blob';
import { createHash } from 'crypto';

export interface UrlData {
  code: string;
  original: string;
  hits: number;
  createdAt: string;
}

// ── helpers ──────────────────────────────────────────────────────────────────

async function readJson<T>(pathname: string): Promise<T | null> {
  const { blobs } = await list({ prefix: pathname, limit: 1 });
  const match = blobs.find(b => b.pathname === pathname);
  if (!match) return null;
  const res = await fetch(match.url, { cache: 'no-store' });
  if (!res.ok) return null;
  return res.json() as Promise<T>;
}

async function writeJson(pathname: string, data: unknown): Promise<void> {
  await put(pathname, JSON.stringify(data), {
    access: 'public',
    addRandomSuffix: false,
    contentType: 'application/json',
  });
}

function urlHash(original: string): string {
  return createHash('sha256').update(original).digest('hex').slice(0, 24);
}

// ── public API ────────────────────────────────────────────────────────────────

/** Persist a new short URL (and a reverse-lookup entry for deduplication). */
export async function saveUrl(code: string, original: string): Promise<void> {
  const data: UrlData = {
    code,
    original,
    hits: 0,
    createdAt: new Date().toISOString(),
  };
  await Promise.all([
    writeJson(`urls/${code}.json`, data),
    writeJson(`lookup/${urlHash(original)}.json`, { code }),
  ]);
}

/** Fetch URL data by short code. Returns null if not found. */
export async function getUrl(code: string): Promise<UrlData | null> {
  return readJson<UrlData>(`urls/${code}.json`);
}

/** Return the existing short code for a URL, or null if not yet shortened. */
export async function findCodeByOriginal(original: string): Promise<string | null> {
  const result = await readJson<{ code: string }>(`lookup/${urlHash(original)}.json`);
  return result?.code ?? null;
}

/** Increment the hit counter for a short code (run in the background). */
export async function incrementHits(code: string): Promise<void> {
  const data = await getUrl(code);
  if (!data) return;
  await writeJson(`urls/${code}.json`, { ...data, hits: data.hits + 1 });
}

/** Return the most recently created short URLs. */
export async function getRecent(limit = 20): Promise<UrlData[]> {
  const { blobs } = await list({ prefix: 'urls/' });
  const items = await Promise.all(
    blobs.map(b =>
      fetch(b.url, { cache: 'no-store' }).then(r => r.json() as Promise<UrlData>)
    )
  );
  return items
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}
