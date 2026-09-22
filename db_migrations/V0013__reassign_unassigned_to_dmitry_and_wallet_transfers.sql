UPDATE t_p41757892_expense_management_b.transactions
SET whitelist_id = 1
WHERE whitelist_id IS NULL;

CREATE TABLE IF NOT EXISTS t_p41757892_expense_management_b.wallet_transfers (
    id SERIAL PRIMARY KEY,
    from_whitelist_id INTEGER REFERENCES t_p41757892_expense_management_b.bot_whitelist(id),
    to_whitelist_id INTEGER REFERENCES t_p41757892_expense_management_b.bot_whitelist(id),
    amount NUMERIC(15,2) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wallet_transfers_from ON t_p41757892_expense_management_b.wallet_transfers(from_whitelist_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transfers_to ON t_p41757892_expense_management_b.wallet_transfers(to_whitelist_id);
