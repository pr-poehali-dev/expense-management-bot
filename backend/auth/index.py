import json
import os
import hashlib
import random
import time
import requests

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
}

MAX_API = "https://platform-api.max.ru"

# Хранилище кодов в памяти: { code: (expires_at, login) }
# Коды живут 5 минут, сбрасываются при рестарте функции
_codes: dict = {}


def resp(code, body):
    return {'statusCode': code, 'headers': CORS, 'body': json.dumps(body, ensure_ascii=False)}


def send_max_message(chat_id: str, text: str):
    token = os.environ.get('MAX_BOT_TOKEN', '')
    if not token or not chat_id:
        return False
    try:
        r = requests.post(
            f"{MAX_API}/messages",
            headers={"Authorization": token},
            params={"chat_id": chat_id},
            json={"text": text},
            timeout=10,
        )
        print(f"Max API response: {r.status_code} {r.text[:200]}")
        return r.status_code == 200
    except Exception as e:
        print(f"Max API error: {e}")
        return False


def handler(event: dict, context) -> dict:
    """2FA-аутентификация: логин/пароль → код в Max-бот → токен."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    method = event.get('httpMethod', 'GET')

    # POST /  — шаг 1: проверяем логин/пароль, отправляем код в Max
    # POST / с полем code — шаг 2: проверяем код, возвращаем токен
    if method == 'POST':
        body = json.loads(event.get('body') or '{}')
        login = body.get('login', '').strip()
        password = body.get('password', '').strip()
        code_input = body.get('code', '').strip()

        admin_login = os.environ.get('ADMIN_LOGIN', 'admin')
        admin_password = os.environ.get('ADMIN_PASSWORD', '')

        if not admin_password:
            return resp(500, {'error': 'Пароль администратора не настроен'})

        if login != admin_login or password != admin_password:
            return resp(401, {'ok': False, 'error': 'Неверный логин или пароль'})

        # Шаг 2 — пришёл код, проверяем
        if code_input:
            now = time.time()
            entry = _codes.get(code_input)
            if not entry:
                return resp(401, {'ok': False, 'error': 'Неверный код'})
            expires_at, code_login = entry
            if now > expires_at:
                _codes.pop(code_input, None)
                return resp(401, {'ok': False, 'error': 'Код истёк, запросите новый'})
            if code_login != login:
                return resp(401, {'ok': False, 'error': 'Неверный код'})
            _codes.pop(code_input, None)
            salt = os.environ.get('AUTH_SALT', 'poehali-salt-2024')
            token = hashlib.sha256(f'{login}:{password}:{salt}'.encode()).hexdigest()
            return resp(200, {'ok': True, 'token': token})

        # Шаг 1 — генерируем код и отправляем в Max
        chat_id = os.environ.get('MAX_BOT_ADMIN_CHAT_ID', '')
        if not chat_id:
            # 2FA не настроена — входим без кода
            salt = os.environ.get('AUTH_SALT', 'poehali-salt-2024')
            token = hashlib.sha256(f'{login}:{password}:{salt}'.encode()).hexdigest()
            return resp(200, {'ok': True, 'token': token, '2fa': False})

        code = str(random.randint(100000, 999999))
        _codes[code] = (time.time() + 300, login)  # 5 минут

        sent = send_max_message(chat_id, f"🔐 Код для входа в ФинансПро: {code}\n\nДействителен 5 минут.")
        if not sent:
            return resp(500, {'ok': False, 'error': 'Не удалось отправить код в Max. Проверьте MAX_BOT_ADMIN_CHAT_ID'})

        return resp(200, {'ok': True, '2fa': True, 'message': 'Код отправлен в Max-бот'})

    # GET /verify — проверка токена
    if method == 'GET':
        params = event.get('queryStringParameters') or {}
        token = params.get('token', '')
        if not token:
            return resp(400, {'ok': False, 'error': 'Токен не передан'})

        admin_login = os.environ.get('ADMIN_LOGIN', 'admin')
        admin_password = os.environ.get('ADMIN_PASSWORD', '')
        salt = os.environ.get('AUTH_SALT', 'poehali-salt-2024')

        expected = hashlib.sha256(f'{admin_login}:{admin_password}:{salt}'.encode()).hexdigest()
        if token == expected:
            return resp(200, {'ok': True})
        return resp(401, {'ok': False, 'error': 'Токен недействителен'})

    return resp(405, {'error': 'Method not allowed'})