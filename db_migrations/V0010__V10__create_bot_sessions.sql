CREATE TABLE t_p41757892_expense_management_b.bot_sessions (
  user_id BIGINT PRIMARY KEY,
  state VARCHAR(50) NOT NULL DEFAULT '',
  data JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
)