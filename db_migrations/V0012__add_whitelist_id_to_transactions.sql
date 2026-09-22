ALTER TABLE t_p41757892_expense_management_b.transactions
ADD COLUMN IF NOT EXISTS whitelist_id INTEGER REFERENCES t_p41757892_expense_management_b.bot_whitelist(id);

CREATE INDEX IF NOT EXISTS idx_transactions_whitelist_id ON t_p41757892_expense_management_b.transactions(whitelist_id);
