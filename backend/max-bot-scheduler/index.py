"""
Ежедневный планировщик уведомлений бота Max.
Запускается каждое утро и отправляет напоминания об оплате тем клиентам,
у которых сегодня день оплаты (payment_day = текущий день месяца).
Уведомление получают все активные пользователи из whitelist с привязанным user_id.
"""
import json
import os
import datetime
import psycopg2
import requests
from psycopg2.extras import RealDictCursor

SCHEMA = "t_p41757892_expense_management_b"
MAX_API = "https://platform-api.max.ru"
CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def get_token():
    return os.environ.get("MAX_BOT_TOKEN", "")


def send_message(chat_id: int, text: str):
    token = get_token()
    try:
        requests.post(
            f"{MAX_API}/messages",
            headers={"Authorization": token},
            params={"chat_id": chat_id},
            json={"text": text},
            timeout=10,
        )
    except Exception:
        pass


def fmt(amount: float) -> str:
    return f"{amount:,.0f} ₽".replace(",", " ")


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    conn = get_conn()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    today = datetime.date.today()
    day = today.day

    # Клиенты у которых сегодня день оплаты
    cur.execute(f"""
        SELECT id, last_name, first_name, middle_name,
               monthly_cost::float, payment_day
        FROM {SCHEMA}.clients
        WHERE payment_day = {day}
        ORDER BY last_name, first_name
    """)
    clients = [dict(r) for r in cur.fetchall()]

    # Все активные получатели уведомлений
    cur.execute(f"""
        SELECT user_id FROM {SCHEMA}.bot_whitelist
        WHERE is_active = TRUE AND user_id IS NOT NULL
    """)
    recipients = [r["user_id"] for r in cur.fetchall()]

    cur.close()
    conn.close()

    if not clients or not recipients:
        return {
            "statusCode": 200,
            "headers": CORS,
            "body": json.dumps({
                "date": today.isoformat(),
                "clients_today": len(clients),
                "recipients": len(recipients),
                "sent": 0,
            })
        }

    # Формируем сообщение
    lines = []
    total = 0.0
    for c in clients:
        full = f"{c['last_name']} {c['first_name']} {c.get('middle_name', '')}".strip()
        lines.append(f"  • {full} — {fmt(c['monthly_cost'])}")
        total += c["monthly_cost"]

    plural = _plural(len(clients), "клиент", "клиента", "клиентов")
    text = (
        f"🔔 Напоминание об оплате — {today.strftime('%d.%m.%Y')}\n\n"
        f"Сегодня день оплаты у {len(clients)} {plural}:\n\n"
        + "\n".join(lines)
        + f"\n\n💰 Итого ожидается: {fmt(total)}"
    )

    # Рассылаем всем получателям
    for user_id in recipients:
        send_message(user_id, text)

    return {
        "statusCode": 200,
        "headers": CORS,
        "body": json.dumps({
            "date": today.isoformat(),
            "day": day,
            "clients_today": len(clients),
            "recipients": len(recipients),
            "sent": len(recipients),
            "total_amount": total,
        })
    }


def _plural(n: int, one: str, few: str, many: str) -> str:
    if 11 <= n % 100 <= 14:
        return many
    r = n % 10
    if r == 1:
        return one
    if 2 <= r <= 4:
        return few
    return many
