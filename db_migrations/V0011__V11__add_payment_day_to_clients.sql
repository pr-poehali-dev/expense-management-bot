ALTER TABLE t_p41757892_expense_management_b.clients
ADD COLUMN payment_day SMALLINT DEFAULT NULL CHECK (payment_day BETWEEN 1 AND 31)