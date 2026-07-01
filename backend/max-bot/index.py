"""
Webhook-обработчик для бота мессенджера Max (VK Max).
Принимает входящие сообщения и отвечает как финансовый ассистент:
- /start, /помощь — приветствие и список команд
- /баланс — текущий баланс (доходы - расходы)
- /доходы — сумма доходов
- /расходы — сумма расходов и топ-категории
- /клиенты — количество клиентов и выручка
- произвольный текст — умный ответ на основе данных
"""
import json
import os
import re
import requests
import psycopg2
from psycopg2.extras import RealDictCursor

SCHEMA = "t_p41757892_expense_management_b"
MAX_API = "https://platform-api.max.ru"
CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}


def get_token():
    return os.environ.get("MAX_BOT_TOKEN", "")


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def normalize_phone(phone: str) -> str:
    digits = re.sub(r'\D', '', phone)
    if digits.startswith('8') and len(digits) == 11:
        digits = '7' + digits[1:]
    return '+' + digits


def is_allowed(user_id: int, cur) -> bool:
    """
    Проверяем доступ по user_id.
    Если whitelist пуст — доступ открыт всем.
    Иначе — только тем, чей user_id добавлен в список.
    """
    cur.execute(f"SELECT COUNT(*) AS cnt FROM {SCHEMA}.bot_whitelist WHERE is_active = TRUE")
    total = cur.fetchone()["cnt"]
    if total == 0:
        return True  # whitelist пуст — открытый режим

    if not user_id:
        return False

    cur.execute(
        f"SELECT id FROM {SCHEMA}.bot_whitelist WHERE user_id = {int(user_id)} AND is_active = TRUE"
    )
    return cur.fetchone() is not None


def send_message(chat_id, text):
    """Отправляет сообщение пользователю через Max Bot API."""
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


def get_totals(cur):
    cur.execute(f"""
        SELECT
            COALESCE(SUM(CASE WHEN type='income' THEN amount ELSE 0 END), 0)::float AS income,
            COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END), 0)::float AS expense
        FROM {SCHEMA}.transactions
    """)
    return dict(cur.fetchone())


def fmt(amount):
    return f"{amount:,.0f} ₽".replace(",", " ")


def get_session(user_id: int, cur) -> dict:
    cur.execute(f"SELECT state, data FROM {SCHEMA}.bot_sessions WHERE user_id = {int(user_id)}")
    row = cur.fetchone()
    return {"state": row["state"], "data": row["data"]} if row else {"state": "", "data": {}}


def save_session(user_id: int, state: str, data: dict, cur, conn):
    cur.execute(f"""
        INSERT INTO {SCHEMA}.bot_sessions (user_id, state, data, updated_at)
        VALUES ({int(user_id)}, %s, %s::jsonb, NOW())
        ON CONFLICT (user_id) DO UPDATE SET state = EXCLUDED.state, data = EXCLUDED.data, updated_at = NOW()
    """, (state, json.dumps(data, ensure_ascii=False)))
    conn.commit()


def clear_session(user_id: int, cur, conn):
    cur.execute(f"DELETE FROM {SCHEMA}.bot_sessions WHERE user_id = {int(user_id)}")
    conn.commit()


def handle_add_client(text: str, user_id: int, cur, conn) -> str:
    """Пошаговый диалог добавления клиента."""
    session = get_session(user_id, cur)
    state = session["state"]
    data = session["data"]
    t = text.strip()

    # Отмена в любой момент
    if t.lower() in ("/отмена", "отмена", "/cancel"):
        clear_session(user_id, cur, conn)
        return "❌ Добавление клиента отменено."

    # Шаг 1 — фамилия
    if state == "client_last_name":
        if len(t) < 2:
            return "Введите фамилию (минимум 2 символа):"
        data["last_name"] = t
        save_session(user_id, "client_first_name", data, cur, conn)
        return f"✅ Фамилия: {t}\n\nВведите имя:"

    # Шаг 2 — имя
    if state == "client_first_name":
        if len(t) < 2:
            return "Введите имя (минимум 2 символа):"
        data["first_name"] = t
        save_session(user_id, "client_middle_name", data, cur, conn)
        return f"✅ Имя: {t}\n\nВведите отчество (или напишите «нет»):"

    # Шаг 3 — отчество
    if state == "client_middle_name":
        data["middle_name"] = "" if t.lower() in ("нет", "-", "—") else t
        save_session(user_id, "client_cost", data, cur, conn)
        return f"✅ Отчество: {data['middle_name'] or '—'}\n\nВведите ежемесячную стоимость (в рублях, например 15000):"

    # Шаг 4 — стоимость
    if state == "client_cost":
        digits = re.sub(r'[^\d.]', '', t)
        try:
            cost = float(digits)
        except ValueError:
            return "Введите сумму цифрами (например: 15000):"
        data["monthly_cost"] = cost
        save_session(user_id, "client_payment_day", data, cur, conn)
        return (
            f"✅ Стоимость: {fmt(cost)} / мес\n\n"
            f"📅 Введите день месяца для напоминания об оплате (1–31):\n\n"
            f"(или напишите «нет», чтобы пропустить)"
        )

    # Шаг 5 — день оплаты
    if state == "client_payment_day":
        if t.lower() in ("нет", "-", "—", "no"):
            data["payment_day"] = None
        else:
            digits = re.sub(r'\D', '', t)
            try:
                day = int(digits)
                if not (1 <= day <= 31):
                    return "Введите число от 1 до 31 (или «нет» чтобы пропустить):"
                data["payment_day"] = day
            except ValueError:
                return "Введите число от 1 до 31 (или «нет» чтобы пропустить):"
        save_session(user_id, "client_confirm", data, cur, conn)
        ln = data.get("last_name", "")
        fn = data.get("first_name", "")
        mn = data.get("middle_name", "")
        full = f"{ln} {fn} {mn}".strip()
        payment_day = data.get("payment_day")
        payment_str = f"каждое {payment_day}-е число" if payment_day else "без напоминания"
        return (
            f"📋 Проверьте данные клиента:\n\n"
            f"👤 {full}\n"
            f"💰 Ежемесячно: {fmt(data['monthly_cost'])}\n"
            f"🔔 Напоминание: {payment_str}\n\n"
            f"Всё верно? Ответьте «да» или «нет»"
        )

    # Шаг 6 — подтверждение
    if state == "client_confirm":
        if t.lower() in ("да", "yes", "верно", "ок", "ok", "+"):
            import datetime, calendar
            payment_day = data.get("payment_day")
            payment_day_sql = str(int(payment_day)) if payment_day else "NULL"
            cur.execute(f"""
                INSERT INTO {SCHEMA}.clients (last_name, first_name, middle_name, monthly_cost, opened_at, payment_day)
                VALUES (%s, %s, %s, %s, CURRENT_DATE, {payment_day_sql})
                RETURNING id
            """, (data["last_name"], data["first_name"], data.get("middle_name", ""), data["monthly_cost"]))
            conn.commit()
            new_id = cur.fetchone()["id"]

            # Создаём напоминание об оплате
            reminder_msg = ""
            if payment_day and data["monthly_cost"] > 0:
                day = int(payment_day)
                today = datetime.date.today()
                try:
                    due = today.replace(day=day)
                except ValueError:
                    due = today.replace(day=calendar.monthrange(today.year, today.month)[1])
                if due < today:
                    next_month = today.month + 1 if today.month < 12 else 1
                    next_year = today.year if today.month < 12 else today.year + 1
                    try:
                        due = due.replace(year=next_year, month=next_month)
                    except ValueError:
                        due = due.replace(year=next_year, month=next_month,
                                          day=calendar.monthrange(next_year, next_month)[1])
                full_name = f"{data['last_name']} {data['first_name']}".strip()
                cur.execute(f"""
                    INSERT INTO {SCHEMA}.reminders (title, amount, due_date, status)
                    VALUES (%s, {data['monthly_cost']}, '{due.isoformat()}', 'upcoming')
                """, (f"Оплата: {full_name}",))
                conn.commit()
                reminder_msg = f"\n🔔 Напоминание создано на {due.strftime('%d.%m.%Y')}"

            clear_session(user_id, cur, conn)
            full = f"{data['last_name']} {data['first_name']} {data.get('middle_name', '')}".strip()
            return (
                f"✅ Клиент добавлен!\n\n"
                f"👤 {full}\n"
                f"💰 {fmt(data['monthly_cost'])} / мес\n"
                f"🆔 #{new_id}"
                f"{reminder_msg}"
            )
        else:
            clear_session(user_id, cur, conn)
            return "❌ Отменено. Для повторного добавления отправьте /новый_клиент"

    return ""


def process_message(text: str, chat_id, user_id: int, cur, conn) -> str:
    t = text.strip().lower()

    # Проверяем — не в диалоге ли пользователь
    session = get_session(user_id, cur)
    if session["state"].startswith("client_"):
        return handle_add_client(text, user_id, cur, conn)

    # /start или /помощь
    if t in ("/start", "start", "/помощь", "помощь", "/help"):
        return (
            "👋 Привет! Я финансовый ассистент ФинансПро.\n\n"
            "⚡ Быстрое добавление:\n"
            "  −10000 хлеб → расход\n"
            "  +50000 зарплата → доход\n\n"
            "📋 Команды:\n"
            "📊 /баланс — текущий баланс\n"
            "📈 /доходы — сумма поступлений\n"
            "📉 /расходы — анализ трат\n"
            "👥 /клиенты — база клиентов\n"
            "➕ /новый_клиент — добавить клиента\n"
            "🔔 /напоминания — предстоящие платежи"
        )

    # /баланс
    if t in ("/баланс", "баланс", "/balance") or "баланс" in t or "остаток" in t:
        totals = get_totals(cur)
        balance = totals["income"] - totals["expense"]
        sign = "+" if balance >= 0 else ""
        return (
            f"💼 Финансовый баланс:\n\n"
            f"📈 Доходы: {fmt(totals['income'])}\n"
            f"📉 Расходы: {fmt(totals['expense'])}\n"
            f"{'━' * 22}\n"
            f"💰 Баланс: {sign}{fmt(balance)}"
        )

    # /доходы
    if t in ("/доходы", "доходы") or t.startswith("доход"):
        totals = get_totals(cur)
        cur.execute(f"""
            SELECT c.name, COALESCE(SUM(t.amount),0)::float AS total
            FROM {SCHEMA}.categories c
            LEFT JOIN {SCHEMA}.transactions t ON t.category_id = c.id AND t.type = 'income'
            WHERE c.type = 'income'
            GROUP BY c.name ORDER BY total DESC LIMIT 5
        """)
        cats = cur.fetchall()
        lines = "\n".join(f"  • {r['name']}: {fmt(r['total'])}" for r in cats if r["total"] > 0)
        return (
            f"📈 Доходы всего: {fmt(totals['income'])}\n\n"
            f"По категориям:\n{lines or '  Нет данных'}"
        )

    # /расходы
    if t in ("/расходы", "расходы") or t.startswith("расход"):
        totals = get_totals(cur)
        cur.execute(f"""
            SELECT c.name, COALESCE(SUM(t.amount),0)::float AS total
            FROM {SCHEMA}.categories c
            LEFT JOIN {SCHEMA}.transactions t ON t.category_id = c.id AND t.type = 'expense'
            WHERE c.type = 'expense'
            GROUP BY c.name ORDER BY total DESC LIMIT 5
        """)
        cats = cur.fetchall()
        lines = "\n".join(f"  • {r['name']}: {fmt(r['total'])}" for r in cats if r["total"] > 0)
        return (
            f"📉 Расходы всего: {fmt(totals['expense'])}\n\n"
            f"Топ категорий:\n{lines or '  Нет данных'}"
        )

    # /новый_клиент
    if t in ("/новый_клиент", "новый_клиент", "/add_client", "/новый клиент", "новый клиент"):
        save_session(user_id, "client_last_name", {}, cur, conn)
        return "➕ Добавление клиента\n\nВведите фамилию:\n\n(Для отмены — /отмена)"

    # /клиенты
    if t in ("/клиенты", "клиенты") or "клиент" in t:
        cur.execute(f"""
            SELECT COUNT(*) AS cnt,
                   COALESCE(SUM(monthly_cost),0)::float AS monthly
            FROM {SCHEMA}.clients
        """)
        row = dict(cur.fetchone())
        return (
            f"👥 База клиентов:\n\n"
            f"Всего клиентов: {int(row['cnt'])}\n"
            f"Выручка в месяц: {fmt(row['monthly'])}"
        )

    # /напоминания
    if t in ("/напоминания", "напоминания") or "напомин" in t or "платёж" in t or "оплат" in t:
        cur.execute(f"""
            SELECT title, amount::float, due_date::text, status
            FROM {SCHEMA}.reminders
            WHERE status IN ('upcoming', 'overdue')
            ORDER BY due_date ASC LIMIT 5
        """)
        rows = cur.fetchall()
        if not rows:
            return "🔔 Нет предстоящих платежей."
        lines = []
        for r in rows:
            icon = "🔴" if r["status"] == "overdue" else "🟡"
            lines.append(f"{icon} {r['title']}: {fmt(r['amount'])} — {r['due_date']}")
        return "🔔 Предстоящие платежи:\n\n" + "\n".join(lines)

    # Быстрое добавление транзакции: -10000 хлеб  или  +50000 зарплата
    quick_match = re.match(r'^([+\-−])?\s*(\d[\d\s]*)\s+(.+)$', text.strip())
    if quick_match:
        sign_char = quick_match.group(1) or ''
        amount_raw = quick_match.group(2).replace(' ', '')
        description = quick_match.group(3).strip()
        try:
            amount = float(amount_raw)
        except ValueError:
            amount = 0
        if amount > 0:
            # Определяем тип: - или − → расход, + → доход, без знака → расход
            tx_type = 'income' if sign_char == '+' else 'expense'

            # Ищем подходящую категорию по ключевым словам описания
            cur.execute(f"""
                SELECT id, name FROM {SCHEMA}.categories
                WHERE type = '{tx_type}'
                ORDER BY id LIMIT 10
            """)
            cats = cur.fetchall()
            category_id = cats[0]["id"] if cats else None  # дефолт — первая категория

            # Попытка подобрать категорию по описанию
            desc_lower = description.lower()
            food_words = ["хлеб", "еда", "продукт", "магазин", "кофе", "обед", "ужин", "завтрак", "пицца", "кафе", "ресторан", "супермаркет", "пятёрочка", "перекрёсток"]
            transport_words = ["такси", "метро", "автобус", "бензин", "заправка", "uber", "яндекс", "транспорт"]
            house_words = ["аренда", "квартира", "жкх", "коммунал", "электричество", "интернет"]
            salary_words = ["зарплата", "оклад", "аванс", "премия", "бонус"]
            freelance_words = ["фриланс", "проект", "заказ", "клиент", "оплата", "перевод"]

            for cat in cats:
                cname = cat["name"].lower()
                if tx_type == 'expense':
                    if any(w in desc_lower for w in food_words) and any(w in cname for w in ["питание", "еда", "продукт", "кафе"]):
                        category_id = cat["id"]; break
                    if any(w in desc_lower for w in transport_words) and any(w in cname for w in ["транспорт", "авто", "дорог"]):
                        category_id = cat["id"]; break
                    if any(w in desc_lower for w in house_words) and any(w in cname for w in ["жильё", "аренда", "жкх", "коммун"]):
                        category_id = cat["id"]; break
                else:
                    if any(w in desc_lower for w in salary_words) and any(w in cname for w in ["зарплат", "оклад"]):
                        category_id = cat["id"]; break
                    if any(w in desc_lower for w in freelance_words) and any(w in cname for w in ["фриланс", "проект", "клиент"]):
                        category_id = cat["id"]; break

            cat_sql = str(category_id) if category_id else "NULL"
            cur.execute(f"""
                INSERT INTO {SCHEMA}.transactions (type, amount, category_id, description, date)
                VALUES ('{tx_type}', {amount}, {cat_sql}, %s, CURRENT_DATE)
                RETURNING id
            """, (description,))
            conn.commit()
            new_id = cur.fetchone()["id"]

            # Находим имя категории для отображения
            cat_name = next((c["name"] for c in cats if c["id"] == category_id), "—")
            icon = "📈" if tx_type == 'income' else "📉"
            sign_out = "+" if tx_type == 'income' else "−"
            tx_word = "Доход" if tx_type == 'income' else "Расход"

            totals = get_totals(cur)
            balance = totals["income"] - totals["expense"]
            balance_sign = "+" if balance >= 0 else ""

            return (
                f"{icon} {tx_word} записан!\n\n"
                f"💬 {description}\n"
                f"💰 {sign_out}{fmt(amount)}\n"
                f"🏷 {cat_name}\n"
                f"🆔 #{new_id}\n\n"
                f"Текущий баланс: {balance_sign}{fmt(balance)}"
            )

    # Default
    totals = get_totals(cur)
    balance = totals["income"] - totals["expense"]
    return (
        f"🤖 Я финансовый ассистент ФинансПро.\n\n"
        f"Текущий баланс: {fmt(balance)}\n\n"
        f"Быстрое добавление:\n"
        f"  −10000 хлеб  → расход\n"
        f"  +50000 зарплата  → доход\n\n"
        f"Команды: /баланс /доходы /расходы /клиенты /новый_клиент /напоминания"
    )


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    # GET — верификация или управление webhook
    if event.get("httpMethod") == "GET":
        params = event.get("queryStringParameters") or {}

        if "hub.challenge" in params:
            return {"statusCode": 200, "headers": CORS, "body": params["hub.challenge"]}

        action = params.get("action", "")
        token = get_token()
        webhook_url = "https://functions.poehali.dev/6d04dfcc-f4f2-49f8-8b31-b5625f95bc30"

        # Debug: проверяем что токен загружен
        token_debug = f"len={len(token)},starts={token[:8] if token else 'EMPTY'}"
        # Max Bot API: токен без "Bearer"
        auth = {"Authorization": token, "Content-Type": "application/json"}

        if action == "debug":
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"token_debug": token_debug})}

        if action == "setup":
            r = requests.post(
                f"{MAX_API}/subscriptions",
                headers=auth,
                json={
                    "url": webhook_url,
                    "update_types": ["message_created", "bot_started", "message_callback"],
                },
                timeout=10,
            )
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"setup_status": r.status_code, "response": r.text}, ensure_ascii=False)}

        if action == "info":
            bot_r = requests.get(f"{MAX_API}/me", headers=auth, timeout=10)
            subs_r = requests.get(f"{MAX_API}/subscriptions", headers=auth, timeout=10)
            result = {
                "bot": bot_r.json() if bot_r.ok else bot_r.text,
                "subscriptions": subs_r.json() if subs_r.ok else subs_r.text,
                "webhook_url": webhook_url,
            }
            return {"statusCode": 200, "headers": CORS, "body": json.dumps(result, ensure_ascii=False, default=str)}

        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"status": "ok"})}

    # Входящий update от Max
    body_raw = event.get("body") or "{}"
    try:
        update = json.loads(body_raw)
    except Exception:
        return {"statusCode": 200, "headers": CORS, "body": "ok"}

    # Max Bot API структура update:
    # { "update_type": "message_created", "timestamp": ...,
    #   "message": { "sender": {"user_id":...}, "recipient": {"chat_id":...},
    #                "body": {"text": "..."} } }
    update_type = update.get("update_type") or update.get("type", "")

    if update_type == "message_created":
        message = update.get("message", {})
        body_obj = message.get("body", {})
        text = body_obj.get("text", "")

        # chat_id: для личных сообщений = user_id отправителя
        recipient = message.get("recipient", {})
        sender = message.get("sender", {})
        chat_id = (
            recipient.get("chat_id")
            or sender.get("user_id")
            or update.get("chat_id")
        )

        if text and chat_id:
            conn = get_conn()
            cur = conn.cursor(cursor_factory=RealDictCursor)
            try:
                user_id_int = sender.get("user_id") or chat_id

                # Команда /привязать +79001234567 — привязывает user_id к номеру в whitelist
                t_check = text.strip()
                if t_check.lower().startswith("/привязать") or t_check.lower().startswith("/link"):
                    parts = t_check.split(maxsplit=1)
                    phone_raw = parts[1].strip() if len(parts) > 1 else ""
                    if phone_raw:
                        norm = normalize_phone(phone_raw)
                        cur.execute(
                            f"UPDATE {SCHEMA}.bot_whitelist SET user_id = {int(user_id_int)} WHERE phone = %s AND is_active = TRUE RETURNING id",
                            (norm,)
                        )
                        conn.commit()
                        if cur.fetchone():
                            send_message(chat_id, "✅ Доступ открыт! Теперь вы в списке разрешённых пользователей.")
                        else:
                            send_message(chat_id, f"❌ Номер {norm} не найден в списке. Обратитесь к администратору.")
                        return {"statusCode": 200, "headers": CORS, "body": "ok"}
                    else:
                        send_message(chat_id, "Укажите номер телефона:\n/привязать +79001234567")
                        return {"statusCode": 200, "headers": CORS, "body": "ok"}

                if not is_allowed(user_id_int, cur):
                    conn.commit()
                    send_message(chat_id,
                        "🔒 Доступ закрыт.\n\n"
                        "Для получения доступа отправьте команду:\n"
                        "/привязать +79001234567\n\n"
                        "Замените номер на тот, что добавил администратор."
                    )
                    return {"statusCode": 200, "headers": CORS, "body": "ok"}
                conn.commit()
                reply = process_message(text, chat_id, user_id_int, cur, conn)
            finally:
                cur.close()
                conn.close()
            send_message(chat_id, reply)

    return {"statusCode": 200, "headers": CORS, "body": "ok"}