"""
Единый API финансовой системы.
Маршрутизация по query-параметру ?resource=:
  transactions  — GET (list), POST (create)
  categories    — GET (list), POST (create)
  analytics     — GET (monthly + by_category + totals)
  reminders     — GET (list), POST (create), PUT (update status, ?id=N)
  clients       — GET (list), POST (create), PUT (update, ?id=N)
"""
import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor

SCHEMA = "t_p41757892_expense_management_b"
CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def resp(status, body):
    return {"statusCode": status, "headers": CORS, "body": json.dumps(body, ensure_ascii=False, default=str)}


def handle_transactions(method, params, body, cur, conn):
    if method == "GET":
        tx_type = params.get("type")
        limit = int(params.get("limit", 200))
        where = f"WHERE t.type = '{tx_type}'" if tx_type in ("income", "expense") else ""
        cur.execute(f"""
            SELECT t.id, t.type, t.amount::float, t.description, t.date::text,
                   t.created_at::text,
                   c.id AS category_id, c.name AS category_name,
                   c.color AS category_color, c.icon AS category_icon
            FROM {SCHEMA}.transactions t
            LEFT JOIN {SCHEMA}.categories c ON c.id = t.category_id
            {where}
            ORDER BY t.date DESC, t.created_at DESC
            LIMIT {limit}
        """)
        rows = [dict(r) for r in cur.fetchall()]
        cur.execute(f"SELECT COUNT(*) AS cnt FROM {SCHEMA}.transactions t {where}")
        total = cur.fetchone()["cnt"]
        return resp(200, {"transactions": rows, "total": total})

    if method == "POST":
        tx_type = body.get("type")
        amount = float(body.get("amount", 0))
        category_id = body.get("category_id")
        description = body.get("description", "").strip()
        date = body.get("date") or None
        if tx_type not in ("income", "expense") or amount <= 0:
            return resp(400, {"error": "Неверные данные"})
        cat_sql = str(int(category_id)) if category_id else "NULL"
        date_sql = f"'{date}'" if date else "CURRENT_DATE"
        cur.execute(f"""
            INSERT INTO {SCHEMA}.transactions (type, amount, category_id, description, date)
            VALUES ('{tx_type}', {amount}, {cat_sql}, %s, {date_sql})
            RETURNING id, type, amount::float, description, date::text, created_at::text
        """, (description,))
        conn.commit()
        return resp(201, dict(cur.fetchone()))
    return resp(405, {"error": "Method not allowed"})


def handle_categories(method, params, body, cur, conn):
    if method == "GET":
        cat_type = params.get("type")
        where = f"WHERE type = '{cat_type}'" if cat_type in ("income", "expense") else ""
        cur.execute(f"SELECT * FROM {SCHEMA}.categories {where} ORDER BY type, name")
        return resp(200, {"categories": [dict(r) for r in cur.fetchall()]})

    if method == "POST":
        name = body.get("name", "").strip()
        cat_type = body.get("type")
        color = body.get("color", "#6b7280")
        icon = body.get("icon", "Tag")
        if not name or cat_type not in ("income", "expense"):
            return resp(400, {"error": "Неверные данные"})
        cur.execute(f"""
            INSERT INTO {SCHEMA}.categories (name, type, color, icon)
            VALUES (%s, %s, %s, %s) RETURNING *
        """, (name, cat_type, color, icon))
        conn.commit()
        return resp(201, dict(cur.fetchone()))
    return resp(405, {"error": "Method not allowed"})


def handle_analytics(cur):
    cur.execute(f"""
        SELECT TO_CHAR(date, 'Mon') AS month,
               TO_CHAR(date, 'YYYY-MM') AS month_key,
               SUM(CASE WHEN type='income' THEN amount ELSE 0 END)::float AS income,
               SUM(CASE WHEN type='expense' THEN amount ELSE 0 END)::float AS expense
        FROM {SCHEMA}.transactions
        WHERE date >= DATE_TRUNC('month', NOW()) - INTERVAL '5 months'
        GROUP BY month_key, month ORDER BY month_key
    """)
    monthly = [dict(r) for r in cur.fetchall()]

    cur.execute(f"""
        SELECT c.id, c.name, c.color, c.icon, c.type,
               COALESCE(SUM(t.amount),0)::float AS total, COUNT(t.id) AS tx_count
        FROM {SCHEMA}.categories c
        LEFT JOIN {SCHEMA}.transactions t ON t.category_id = c.id
        GROUP BY c.id, c.name, c.color, c.icon, c.type
        ORDER BY c.type, total DESC
    """)
    by_category = [dict(r) for r in cur.fetchall()]

    cur.execute(f"""
        SELECT SUM(CASE WHEN type='income' THEN amount ELSE 0 END)::float AS total_income,
               SUM(CASE WHEN type='expense' THEN amount ELSE 0 END)::float AS total_expense,
               COUNT(*) AS total_transactions
        FROM {SCHEMA}.transactions
    """)
    totals = dict(cur.fetchone())
    return resp(200, {"monthly": monthly, "by_category": by_category, "totals": totals})


def handle_reminders(method, params, body, cur, conn):
    if method == "GET":
        cur.execute(f"""
            SELECT r.id, r.title, r.amount::float, r.due_date::text, r.status,
                   c.name AS category_name, c.color AS category_color
            FROM {SCHEMA}.reminders r
            LEFT JOIN {SCHEMA}.categories c ON c.id = r.category_id
            ORDER BY r.due_date ASC
        """)
        return resp(200, {"reminders": [dict(r) for r in cur.fetchall()]})

    if method == "POST":
        title = body.get("title", "").strip()
        amount = float(body.get("amount", 0))
        due_date = body.get("due_date")
        category_id = body.get("category_id")
        if not title or amount <= 0 or not due_date:
            return resp(400, {"error": "Неверные данные"})
        cat_sql = str(int(category_id)) if category_id else "NULL"
        cur.execute(f"""
            INSERT INTO {SCHEMA}.reminders (title, amount, due_date, category_id)
            VALUES (%s, {amount}, '{due_date}', {cat_sql})
            RETURNING id, title, amount::float, due_date::text, status
        """, (title,))
        conn.commit()
        return resp(201, dict(cur.fetchone()))

    if method == "PUT":
        reminder_id = params.get("id")
        status = body.get("status")
        if not reminder_id or status not in ("upcoming", "overdue", "done"):
            return resp(400, {"error": "Неверные данные"})
        cur.execute(f"UPDATE {SCHEMA}.reminders SET status='{status}' WHERE id={int(reminder_id)}")
        conn.commit()
        return resp(200, {"ok": True})
    return resp(405, {"error": "Method not allowed"})


def handle_clients(method, params, body, cur, conn):
    if method == "GET":
        search = params.get("search", "").strip()
        where = ""
        if search:
            where = f"WHERE last_name ILIKE '%{search}%' OR first_name ILIKE '%{search}%' OR middle_name ILIKE '%{search}%'"
        cur.execute(f"""
            SELECT id, last_name, first_name, middle_name,
                   monthly_cost::float, opened_at::text, created_at::text
            FROM {SCHEMA}.clients
            {where}
            ORDER BY last_name, first_name
        """)
        rows = [dict(r) for r in cur.fetchall()]
        cur.execute(f"SELECT COUNT(*) AS cnt, COALESCE(SUM(monthly_cost),0)::float AS total FROM {SCHEMA}.clients")
        summary = dict(cur.fetchone())
        return resp(200, {"clients": rows, "total": summary["cnt"], "total_monthly": summary["total"]})

    if method == "POST":
        last_name = body.get("last_name", "").strip()
        first_name = body.get("first_name", "").strip()
        middle_name = body.get("middle_name", "").strip()
        monthly_cost = float(body.get("monthly_cost", 0))
        opened_at = body.get("opened_at") or None
        if not last_name or not first_name:
            return resp(400, {"error": "Фамилия и имя обязательны"})
        date_sql = f"'{opened_at}'" if opened_at else "CURRENT_DATE"
        cur.execute(f"""
            INSERT INTO {SCHEMA}.clients (last_name, first_name, middle_name, monthly_cost, opened_at)
            VALUES (%s, %s, %s, {monthly_cost}, {date_sql})
            RETURNING id, last_name, first_name, middle_name, monthly_cost::float, opened_at::text, created_at::text
        """, (last_name, first_name, middle_name))
        conn.commit()
        return resp(201, dict(cur.fetchone()))

    if method == "PUT":
        client_id = params.get("id")
        if not client_id:
            return resp(400, {"error": "Не указан id"})
        last_name = body.get("last_name", "").strip()
        first_name = body.get("first_name", "").strip()
        middle_name = body.get("middle_name", "").strip()
        monthly_cost = float(body.get("monthly_cost", 0))
        opened_at = body.get("opened_at") or None
        if not last_name or not first_name:
            return resp(400, {"error": "Фамилия и имя обязательны"})
        date_sql = f"'{opened_at}'" if opened_at else "CURRENT_DATE"
        cur.execute(f"""
            UPDATE {SCHEMA}.clients
            SET last_name=%s, first_name=%s, middle_name=%s, monthly_cost={monthly_cost}, opened_at={date_sql}
            WHERE id={int(client_id)}
            RETURNING id, last_name, first_name, middle_name, monthly_cost::float, opened_at::text
        """, (last_name, first_name, middle_name))
        conn.commit()
        return resp(200, dict(cur.fetchone()))

    return resp(405, {"error": "Method not allowed"})


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    resource = params.get("resource", "transactions")
    body = {}
    if event.get("body"):
        body = json.loads(event["body"])
        if not resource or resource == "transactions":
            resource = body.get("resource", resource)

    conn = get_conn()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        if resource == "transactions":
            return handle_transactions(method, params, body, cur, conn)
        if resource == "categories":
            return handle_categories(method, params, body, cur, conn)
        if resource == "analytics":
            return handle_analytics(cur)
        if resource == "reminders":
            return handle_reminders(method, params, body, cur, conn)
        if resource == "clients":
            return handle_clients(method, params, body, cur, conn)
        return resp(400, {"error": f"Неизвестный ресурс: {resource}"})
    finally:
        cur.close()
        conn.close()