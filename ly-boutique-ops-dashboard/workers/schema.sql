-- D1 Schema for LY Boutique Ops Dashboard
-- Cloudflare D1 (SQLite-compatible)

CREATE TABLE IF NOT EXISTS daily_scans (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  store TEXT NOT NULL,
  site TEXT NOT NULL,
  asin TEXT NOT NULL,
  sku TEXT,
  problem_type TEXT,
  anomaly_metric TEXT,
  current_value TEXT,
  compare_value TEXT,
  action_type TEXT,
  priority TEXT,
  confidence TEXT,
  assignee TEXT,
  status TEXT DEFAULT 'not_started',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  source TEXT,
  store TEXT,
  site TEXT,
  asin TEXT,
  sku TEXT,
  task_type TEXT,
  title TEXT NOT NULL,
  description TEXT,
  assignee TEXT,
  priority TEXT,
  deadline TEXT,
  status TEXT DEFAULT 'not_started',
  evidence_json TEXT DEFAULT '[]',
  ai_audit TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  completed_at TEXT
);

CREATE TABLE IF NOT EXISTS asin_records (
  asin TEXT PRIMARY KEY,
  sku TEXT,
  product_name TEXT,
  store TEXT,
  site TEXT,
  owner TEXT,
  grade TEXT,
  status TEXT,
  orders_30d INTEGER DEFAULT 0,
  sales_30d REAL DEFAULT 0,
  acos REAL DEFAULT 0,
  tacos REAL DEFAULT 0,
  net_profit REAL DEFAULT 0,
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  model_provider TEXT,
  model_name TEXT,
  enabled INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS model_configs (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  api_base_url TEXT,
  model_name TEXT,
  enabled INTEGER DEFAULT 1,
  is_default INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'operator',
  stores_json TEXT DEFAULT '[]',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,
  action TEXT,
  target_type TEXT,
  target_id TEXT,
  details TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_daily_scans_date ON daily_scans(date);
CREATE INDEX IF NOT EXISTS idx_daily_scans_asin ON daily_scans(asin);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee);
CREATE INDEX IF NOT EXISTS idx_asin_records_grade ON asin_records(grade);
