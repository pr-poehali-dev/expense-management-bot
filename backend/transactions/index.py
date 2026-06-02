"""
API для управления транзакциями (доходы и расходы).
GET / — список транзакций с фильтрами (type, limit, offset)
POST / — создать транзакцию
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


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    conn = get_conn()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        if method == "GET":
            params = event.get("queryStringParameters") or {}
            tx_type = params.get("type")
            limit = int(params.get("limit", 100))
            offset = int(params.get("offset", 0))

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
                LIMIT {limit} OFFSET {offset}
            """)
            rows = cur.fetchall()
            cur.execute(f"SELECT COUNT(*) AS cnt FROM {SCHEMA}.transactions t {where}")
            total = cur.fetchone()["cnt"]
            return {
                "statusCode": 200,
                "headers": CORS,
                "body": json.dumps({"transactions": [dict(r) for r in rows], "total": total}),
            }

        if method == "POST":
            body = json.loads(event.get("body") or "{}")
            tx_type = body.get("type")
            amount = float(body.get("amount", 0))
            category_id = body.get("category_id")
            description = body.get("description", "").strip()
            date = body.get("date") or "CURRENT_DATE"

            if tx_type not in ("income", "expense") or amount <= 0:
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Неверные данные"})}

            cat_sql = str(category_id) if category_id else "NULL"
            date_sql = f"'{date}'" if date != "CURRENT_DATE" else "CURRENT_DATE"

            cur.execute(f"""
                INSERT INTO {SCHEMA}.transactions (type, amount, category_id, description, date)
                VALUES ('{tx_type}', {amount}, {cat_sql}, %s, {date_sql})
                RETURNING id, type, amount::float, description, date::text, created_at::text
            """, (description,))
            conn.commit()
            row = dict(cur.fetchone())
            return {"statusCode": 201, "headers": CORS, "body": json.dumps(row)}

        return {"statusCode": 405, "headers": CORS, "body": json.dumps({"error": "Method not allowed"})}

    finally:
        cur.close()
        conn.close()
