import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = resolve(__dirname, '..', 'data', 'cognition.db');
mkdirSync(dirname(DB_PATH), { recursive: true });

export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    industry TEXT,
    territory TEXT,
    eng_headcount INTEGER,
    icp_score INTEGER,
    stage TEXT DEFAULT 'Uncontacted',
    deal_value INTEGER DEFAULT 0,
    pain_point TEXT,
    devin_use_case TEXT,
    opening_line TEXT,
    tags TEXT DEFAULT '[]',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    title TEXT,
    linkedin_url TEXT,
    email TEXT,
    phone TEXT,
    last_contacted TEXT,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS outreach (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    contact_id INTEGER REFERENCES contacts(id) ON DELETE SET NULL,
    channel TEXT,
    date_sent TEXT,
    subject TEXT,
    message TEXT,
    status TEXT DEFAULT 'Sent',
    response_notes TEXT,
    follow_up_date TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    description TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    body TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS competitors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    valuation TEXT,
    arr TEXT,
    differentiator TEXT,
    vs_devin_status TEXT,
    battlecard_json TEXT
  );

  CREATE TABLE IF NOT EXISTS conferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    dates TEXT NOT NULL,
    location TEXT,
    city TEXT,
    country TEXT,
    vertical TEXT,
    attendees INTEGER,
    website TEXT,
    description TEXT,
    relevance_score INTEGER DEFAULT 5,
    attending_status TEXT DEFAULT 'undecided',
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS conference_speakers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conference_id INTEGER REFERENCES conferences(id) ON DELETE CASCADE,
    name TEXT,
    title TEXT,
    company TEXT,
    company_type TEXT,
    topic TEXT,
    session_date TEXT,
    linkedin_url TEXT,
    is_competitor INTEGER DEFAULT 0,
    is_target_account INTEGER DEFAULT 0,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_contacts_account ON contacts(account_id);
  CREATE INDEX IF NOT EXISTS idx_outreach_account ON outreach(account_id);
  CREATE INDEX IF NOT EXISTS idx_activities_account ON activities(account_id);
  CREATE INDEX IF NOT EXISTS idx_notes_account ON notes(account_id);
  CREATE INDEX IF NOT EXISTS idx_speakers_conference ON conference_speakers(conference_id);
`);

export function logActivity(accountId, type, description) {
  db.prepare(
    'INSERT INTO activities (account_id, type, description) VALUES (?, ?, ?)'
  ).run(accountId, type, description);
}
