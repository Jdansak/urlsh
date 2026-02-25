import { DatabaseSync } from 'node:sqlite';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'urls.db');

const db = new DatabaseSync(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS urls (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    code       TEXT    NOT NULL UNIQUE,
    original   TEXT    NOT NULL,
    hits       INTEGER NOT NULL DEFAULT 0,
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
  )
`);

export interface UrlRow {
  id: number;
  code: string;
  original: string;
  hits: number;
  created_at: string;
}

const stmtInsert       = db.prepare('INSERT INTO urls (code, original) VALUES (?, ?)');
const stmtFindByCode   = db.prepare('SELECT * FROM urls WHERE code = ?');
const stmtFindByOrig   = db.prepare('SELECT * FROM urls WHERE original = ?');
const stmtIncrHits     = db.prepare('UPDATE urls SET hits = hits + 1 WHERE code = ?');
const stmtRecent       = db.prepare('SELECT * FROM urls ORDER BY id DESC LIMIT 20');

export function insertUrl(code: string, original: string): void {
  stmtInsert.run(code, original);
}

export function findByCode(code: string): UrlRow | undefined {
  return stmtFindByCode.get(code) as UrlRow | undefined;
}

export function findByOriginal(original: string): UrlRow | undefined {
  return stmtFindByOrig.get(original) as UrlRow | undefined;
}

export function incrementHits(code: string): void {
  stmtIncrHits.run(code);
}

export function getRecent(): UrlRow[] {
  return stmtRecent.all() as unknown as UrlRow[];
}
