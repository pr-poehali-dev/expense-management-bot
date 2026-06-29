"""
Скрипт регистрации webhook в Max Bot API.
Вызывается один раз при настройке бота.
GET /?action=setup — зарегистрировать webhook
GET /?action=info  — информация о боте и подписках
"""
import json
import os
import requests

MAX_API = "https://api.max.ru/v1"
WEBHOOK_URL = "https://functions.poehali.dev/6d04dfcc-f4f2-49f8-8b31-b5625f95bc30"

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}


def get_headers():
    token = os.environ.get("MAX_BOT_TOKEN", "")
    return {"Authorization": f"Bearer {token}"}


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    params = event.get("queryStringParameters") or {}
    action = params.get("action", "info")

    if action == "setup":
        # Регистрируем webhook
        r = requests.post(
            f"{MAX_API}/subscriptions",
            json={"url": WEBHOOK_URL},
            headers=get_headers(),
            timeout=10,
        )
        result = {"action": "setup", "status": r.status_code, "response": r.text}
        return {"statusCode": 200, "headers": CORS, "body": json.dumps(result, ensure_ascii=False)}

    if action == "delete":
        # Удаляем все подписки
        r = requests.delete(
            f"{MAX_API}/subscriptions",
            params={"url": WEBHOOK_URL},
            headers=get_headers(),
            timeout=10,
        )
        result = {"action": "delete", "status": r.status_code, "response": r.text}
        return {"statusCode": 200, "headers": CORS, "body": json.dumps(result, ensure_ascii=False)}

    # info — сведения о боте и текущих подписках
    bot_r = requests.get(f"{MAX_API}/me", headers=get_headers(), timeout=10)
    subs_r = requests.get(f"{MAX_API}/subscriptions", headers=get_headers(), timeout=10)

    result = {
        "bot": bot_r.json() if bot_r.ok else {"error": bot_r.text},
        "subscriptions": subs_r.json() if subs_r.ok else {"error": subs_r.text},
        "webhook_url": WEBHOOK_URL,
    }
    return {"statusCode": 200, "headers": CORS, "body": json.dumps(result, ensure_ascii=False, default=str)}
