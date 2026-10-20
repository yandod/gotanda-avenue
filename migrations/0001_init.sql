-- 参加者（セッション）。participant_code は engine が発行するランダムな文字列
CREATE TABLE sessions (
  participant_code TEXT PRIMARY KEY,
  experiment_id    TEXT NOT NULL,
  version          INTEGER NOT NULL,
  condition        TEXT NOT NULL,          -- 参加者間条件（割付結果）
  user_agent       TEXT,
  started_at       TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at     TEXT
);

CREATE INDEX idx_sessions_experiment
  ON sessions (experiment_id, version, condition);

-- 1 試行 1 行。data_json に jsPsych のデータを丸ごと保存する
CREATE TABLE trials (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  participant_code TEXT NOT NULL REFERENCES sessions (participant_code),
  experiment_id    TEXT NOT NULL,
  version          INTEGER NOT NULL,
  trial_index      INTEGER NOT NULL,
  phase            TEXT,
  stimulus_id      TEXT,
  condition        TEXT,                   -- その試行の条件（data.condition）
  rt               REAL,
  response         TEXT,
  data_json        TEXT NOT NULL,
  received_at      TEXT NOT NULL DEFAULT (datetime('now')),
  -- 再送されても二重に保存されない
  UNIQUE (participant_code, trial_index)
);

CREATE INDEX idx_trials_experiment ON trials (experiment_id, version);
