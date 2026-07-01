import json
import os
import hashlib
import secrets

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
}

def resp(code, body):
    return {'statusCode': code, 'headers': CORS, 'body': json.dumps(body, ensure_ascii=False)}


def handler(event: dict, context) -> dict:
    """Аутентификация по логину и паролю. Возвращает токен сессии."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    method = event.get('httpMethod', 'GET')

    # POST /  — вход по логину и паролю
    if method == 'POST':
        body = json.loads(event.get('body') or '{}')
        login = body.get('login', '').strip()
        password = body.get('password', '').strip()

        admin_login = os.environ.get('ADMIN_LOGIN', 'admin')
        admin_password = os.environ.get('ADMIN_PASSWORD', '')

        if not admin_password:
            return resp(500, {'error': 'Пароль администратора не настроен'})

        if login == admin_login and password == admin_password:
            # Генерируем токен: sha256(login + password + secret_salt)
            salt = os.environ.get('AUTH_SALT', 'poehali-salt-2024')
            token = hashlib.sha256(f'{login}:{password}:{salt}'.encode()).hexdigest()
            return resp(200, {'ok': True, 'token': token})

        return resp(401, {'ok': False, 'error': 'Неверный логин или пароль'})

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
