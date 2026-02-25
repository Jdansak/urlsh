'use client';

import { useState, useEffect, FormEvent } from 'react';

interface UrlEntry {
  code: string;
  original: string;
  hits: number;
  createdAt: string;
}

export default function Home() {
  const [url, setUrl]           = useState('');
  const [shortUrl, setShortUrl] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [copied, setCopied]     = useState(false);
  const [stats, setStats]       = useState<UrlEntry[]>([]);

  useEffect(() => { void loadStats(); }, []);

  async function loadStats() {
    try {
      const res  = await fetch('/api/stats');
      const data = await res.json() as UrlEntry[];
      setStats(Array.isArray(data) ? data : []);
    } catch { /* ignore */ }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setError('');
    setShortUrl('');
    try {
      const res  = await fetch('/api/shorten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json() as { shortUrl?: string; error?: string };
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong.');
      } else {
        setShortUrl(data.shortUrl ?? '');
        void loadStats();
      }
    } catch {
      setError('Network error — please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* ignore */ }
  }

  return (
    <main>
      <h1>URLsh</h1>
      <p className="tagline">Paste a long URL. Get a short one.</p>

      <div className="card">
        <form className="input-row" onSubmit={handleSubmit}>
          <input
            type="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://example.com/very/long/url"
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? '…' : 'Shorten'}
          </button>
        </form>

        {error && <p className="error">{error}</p>}

        {shortUrl && (
          <div className="result">
            <p className="result-label">Your short link</p>
            <div className="result-row">
              <a className="short-url" href={shortUrl} target="_blank" rel="noopener noreferrer">
                {shortUrl}
              </a>
              <button className="copy-btn" type="button" onClick={copy}>
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        )}
      </div>

      <section className="stats-section">
        <h2>Recent links</h2>
        {stats.length === 0 ? (
          <p className="empty">No links yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Original URL</th>
                <th className="th-hits">Hits</th>
              </tr>
            </thead>
            <tbody>
              {stats.map(row => (
                <tr key={row.code}>
                  <td className="td-code">
                    <a href={`/${row.code}`} target="_blank" rel="noopener noreferrer">
                      /{row.code}
                    </a>
                  </td>
                  <td className="td-original" title={row.original}>{row.original}</td>
                  <td className="td-hits">{row.hits}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
