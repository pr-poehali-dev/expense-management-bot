CREATE TABLE t_p41757892_expense_management_b.clients (
  id SERIAL PRIMARY KEY,
  last_name VARCHAR(100) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  middle_name VARCHAR(100) NOT NULL DEFAULT '',
  monthly_cost NUMERIC(15,2) NOT NULL DEFAULT 0,
  opened_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
)