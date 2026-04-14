import { createRequire } from 'module';
import { mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const Database = require('better-sqlite3');

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, '../../data/opportunities.db');

let _db = null;

export function getDb() {
  if (_db) return _db;
  mkdirSync(join(__dirname, '../../data'), { recursive: true });
  _db = new Database(DB_PATH);
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');
  return _db;
}

// ── Opportunities ──────────────────────────────────────────────────────────

export function insertOpportunity(opp) {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO opportunities
      (fingerprint, title, source_name, url, raw_text, category, category_confidence,
       keywords, extracted_features, source_published_at)
    VALUES
      (@fingerprint, @title, @source_name, @url, @raw_text, @category, @category_confidence,
       @keywords, @extracted_features, @source_published_at)
  `);
  const result = stmt.run({
    fingerprint:          opp.fingerprint,
    title:                opp.title,
    source_name:          opp.source_name,
    url:                  opp.url ?? null,
    raw_text:             opp.raw_text,
    category:             opp.category ?? null,
    category_confidence:  opp.category_confidence ?? null,
    keywords:             opp.keywords ? JSON.stringify(opp.keywords) : null,
    extracted_features:   opp.extracted_features ? JSON.stringify(opp.extracted_features) : null,
    source_published_at:  opp.source_published_at ?? null,
  });
  return result.lastInsertRowid;
}

export function opportunityExists(fingerprint) {
  const db = getDb();
  const row = db.prepare(`SELECT 1 FROM opportunities WHERE fingerprint = ?`).get(fingerprint);
  return !!row;
}

export function getRawOpportunities(limit = 50) {
  const db = getDb();
  return db.prepare(`
    SELECT * FROM opportunities WHERE status = 'raw'
    ORDER BY fetched_at DESC LIMIT ?
  `).all(limit);
}

export function updateOpportunityScores(id, scores) {
  const db = getDb();
  db.prepare(`
    UPDATE opportunities SET
      time_required     = @time_required,
      earning_potential = @earning_potential,
      difficulty        = @difficulty,
      ai_leverage       = @ai_leverage,
      fit_score         = @fit_score,
      claude_summary    = @claude_summary,
      action_items      = @action_items,
      status            = 'evaluated',
      evaluated_at      = datetime('now')
    WHERE id = @id
  `).run({
    id,
    time_required:     scores.time_required,
    earning_potential: scores.earning_potential,
    difficulty:        scores.difficulty,
    ai_leverage:       scores.ai_leverage,
    fit_score:         scores.fit_score,
    claude_summary:    scores.claude_summary ?? null,
    action_items:      scores.action_items ? JSON.stringify(scores.action_items) : null,
  });
}

export function getUnscheduledEvaluated(limit = 20) {
  const db = getDb();
  return db.prepare(`
    SELECT * FROM opportunities
    WHERE status = 'evaluated'
    ORDER BY fit_score DESC
    LIMIT ?
  `).all(limit);
}

export function setScheduledSlot(id, slot, scheduledDate, actionItems) {
  const db = getDb();
  db.prepare(`
    UPDATE opportunities SET
      scheduled_slot = @slot,
      scheduled_date = @scheduledDate,
      action_items   = @actionItems,
      status         = 'scheduled',
      scheduled_at   = datetime('now')
    WHERE id = @id
  `).run({
    id,
    slot,
    scheduledDate,
    actionItems: actionItems ? JSON.stringify(actionItems) : null,
  });
}

export function getScheduledForDate(date) {
  const db = getDb();
  return db.prepare(`
    SELECT * FROM opportunities
    WHERE scheduled_date = ? AND status = 'scheduled'
    ORDER BY scheduled_slot ASC
  `).all(date);
}

export function getScheduledForWeek(fromDate, toDate) {
  const db = getDb();
  return db.prepare(`
    SELECT * FROM opportunities
    WHERE scheduled_date BETWEEN ? AND ?
      AND status = 'scheduled'
    ORDER BY scheduled_date ASC, scheduled_slot ASC
  `).all(fromDate, toDate);
}

export function getTotalCounts() {
  const db = getDb();
  const rows = db.prepare(`
    SELECT status, COUNT(*) as count FROM opportunities GROUP BY status
  `).all();
  return Object.fromEntries(rows.map(r => [r.status, r.count]));
}

// ── Digests ────────────────────────────────────────────────────────────────

export function upsertDigest(date, content) {
  const db = getDb();
  db.prepare(`
    INSERT INTO digests (date, content)
    VALUES (?, ?)
    ON CONFLICT(date) DO UPDATE SET content = excluded.content, created_at = datetime('now')
  `).run(date, content);
}

// ── Source Runs ────────────────────────────────────────────────────────────

export function recordSourceRun(sourceName, itemsFetched, itemsAdded, errorMessage = null) {
  const db = getDb();
  db.prepare(`
    INSERT INTO source_runs (source_name, items_fetched, items_added, error_message)
    VALUES (?, ?, ?, ?)
  `).run(sourceName, itemsFetched, itemsAdded, errorMessage);
}
