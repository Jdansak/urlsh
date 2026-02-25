import express, { Request, Response } from 'express';
import path from 'path';
import { nanoid } from 'nanoid';
import {
  insertUrl,
  findByCode,
  findByOriginal,
  incrementHits,
  getRecent,
} from './db';

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(express.json());
app.use(express.static(path.join(process.cwd(), 'public')));

// POST /api/shorten  { url: "https://..." }
app.post('/api/shorten', (req: Request, res: Response) => {
  const { url } = req.body as { url?: string };

  if (!url || typeof url !== 'string') {
    res.status(400).json({ error: 'Missing url field.' });
    return;
  }

  // Basic URL validation
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    res.status(400).json({ error: 'Invalid URL.' });
    return;
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    res.status(400).json({ error: 'Only http and https URLs are allowed.' });
    return;
  }

  const normalized = parsed.toString();

  // Reuse existing code if URL was already shortened
  const existing = findByOriginal(normalized);
  if (existing) {
    const shortUrl = buildShortUrl(req, existing.code);
    res.json({ shortUrl, code: existing.code, hits: existing.hits });
    return;
  }

  const code = nanoid(7);
  insertUrl(code, normalized);

  const shortUrl = buildShortUrl(req, code);
  res.json({ shortUrl, code, hits: 0 });
});

// GET /api/stats  — last 20 shortened URLs
app.get('/api/stats', (_req: Request, res: Response) => {
  const rows = getRecent();
  res.json(rows);
});

// GET /:code  — redirect
app.get('/:code', (req: Request, res: Response) => {
  const { code } = req.params;

  const row = findByCode(code);
  if (!row) {
    res.status(404).send('Short URL not found.');
    return;
  }

  incrementHits(code);
  res.redirect(301, row.original);
});

app.listen(PORT, () => {
  console.log(`URLsh running at http://localhost:${PORT}`);
});

function buildShortUrl(req: Request, code: string): string {
  const host = req.headers['x-forwarded-host'] ?? req.headers.host ?? `localhost:${PORT}`;
  const proto = req.headers['x-forwarded-proto'] ?? (req.secure ? 'https' : 'http');
  return `${proto}://${host}/${code}`;
}
