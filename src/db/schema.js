import { getDb } from './client.js';

const CREATE_OPPORTUNITIES = `
CREATE TABLE IF NOT EXISTS opportunities (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    fingerprint         TEXT    NOT NULL UNIQUE,
    title               TEXT    NOT NULL,
    source_name         TEXT    NOT NULL,
    url                 TEXT,
    raw_text            TEXT    NOT NULL,
    category            TEXT,
    category_confidence REAL,
    keywords            TEXT,
    extracted_features  TEXT,
    time_required       REAL,
    earning_potential   REAL,
    difficulty          INTEGER,
    ai_leverage         INTEGER,
    fit_score           REAL,
    claude_summary      TEXT,
    action_items        TEXT,
    scheduled_slot      TEXT,
    scheduled_date      TEXT,
    status              TEXT NOT NULL DEFAULT 'raw',
    fetched_at          TEXT NOT NULL DEFAULT (datetime('now')),
    evaluated_at        TEXT,
    scheduled_at        TEXT,
    source_published_at TEXT
)`;

const CREATE_IDX_STATUS         = `CREATE INDEX IF NOT EXISTS idx_status         ON opportunities(status)`;
const CREATE_IDX_FIT_SCORE      = `CREATE INDEX IF NOT EXISTS idx_fit_score      ON opportunities(fit_score DESC)`;
const CREATE_IDX_SCHEDULED_DATE = `CREATE INDEX IF NOT EXISTS idx_scheduled_date ON opportunities(scheduled_date)`;
const CREATE_IDX_FINGERPRINT    = `CREATE INDEX IF NOT EXISTS idx_fingerprint    ON opportunities(fingerprint)`;
const CREATE_IDX_FETCHED_AT     = `CREATE INDEX IF NOT EXISTS idx_fetched_at     ON opportunities(fetched_at)`;

const CREATE_DIGESTS = `
CREATE TABLE IF NOT EXISTS digests (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    date       TEXT NOT NULL UNIQUE,
    content    TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

const CREATE_SOURCE_RUNS = `
CREATE TABLE IF NOT EXISTS source_runs (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    run_at        TEXT NOT NULL DEFAULT (datetime('now')),
    source_name   TEXT NOT NULL,
    items_fetched INTEGER NOT NULL DEFAULT 0,
    items_added   INTEGER NOT NULL DEFAULT 0,
    error_message TEXT
)`;

export function runMigrations() {
  const db = getDb();
  db.exec(CREATE_OPPORTUNITIES);
  db.exec(CREATE_IDX_STATUS);
  db.exec(CREATE_IDX_FIT_SCORE);
  db.exec(CREATE_IDX_SCHEDULED_DATE);
  db.exec(CREATE_IDX_FINGERPRINT);
  db.exec(CREATE_IDX_FETCHED_AT);
  db.exec(CREATE_DIGESTS);
  db.exec(CREATE_SOURCE_RUNS);
}
