-- Operational Ledger do Copiloto (ADR-015, DEC-03): infraestrutura, não domínio.
-- Tarefas vivem no GitHub; task_index é read model reconstruível a partir dele.
CREATE TABLE IF NOT EXISTS inbound_event (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT NOT NULL,
  external_id TEXT NOT NULL,
  payload TEXT,
  received_at TEXT NOT NULL,
  UNIQUE (source, external_id)
);
CREATE TABLE IF NOT EXISTS command (
  command_id TEXT PRIMARY KEY,
  dedupe_key TEXT NOT NULL UNIQUE,
  source TEXT NOT NULL,
  actor TEXT NOT NULL,
  verb TEXT,
  envelope TEXT NOT NULL,
  status TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  result TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS execution_plan (
  command_id TEXT PRIMARY KEY,
  plan TEXT NOT NULL,
  confirm_token_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used_at TEXT
);
CREATE TABLE IF NOT EXISTS operation_log (
  idempotency_key TEXT PRIMARY KEY,
  command_id TEXT NOT NULL,
  target TEXT NOT NULL,
  result TEXT,
  status TEXT NOT NULL,
  at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS domain_event (
  event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity TEXT NOT NULL,
  type TEXT NOT NULL,
  before TEXT,
  after TEXT,
  command_id TEXT,
  at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS outbox (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  command_id TEXT,
  destination TEXT NOT NULL,
  payload TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDENTE',
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS dead_letter (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  origin TEXT NOT NULL,
  ref TEXT NOT NULL,
  error TEXT NOT NULL,
  last_payload TEXT,
  first_failed_at TEXT NOT NULL,
  replayed_at TEXT
);
CREATE TABLE IF NOT EXISTS schedule_run (
  routine_id TEXT NOT NULL,
  scheduled_for TEXT NOT NULL,
  command_id TEXT,
  status TEXT NOT NULL,
  PRIMARY KEY (routine_id, scheduled_for)
);
CREATE TABLE IF NOT EXISTS sync_state (
  destination TEXT PRIMARY KEY,
  last_hash TEXT,
  last_synced_at TEXT,
  drift INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  at TEXT NOT NULL,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  target TEXT,
  command_id TEXT
);
-- audit_log é append-only: sem UPDATE/DELETE.
CREATE TRIGGER IF NOT EXISTS audit_log_sem_update BEFORE UPDATE ON audit_log BEGIN SELECT RAISE(ABORT, 'audit_log é append-only'); END;
CREATE TRIGGER IF NOT EXISTS audit_log_sem_delete BEFORE DELETE ON audit_log BEGIN SELECT RAISE(ABORT, 'audit_log é append-only'); END;
