import { useState, useRef, useEffect } from 'react';
import Icon from '@/components/ui/icon';

const AUTH_URL = 'https://functions.poehali.dev/75d2f0e5-b484-411b-aed7-af7a2eefc6ac';

interface Props {
  onLogin: (token: string) => void;
}

export default function Login({ onLogin }: Props) {
  const [step, setStep] = useState<'credentials' | 'code'>('credentials');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const codeRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer(v => v - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!login.trim() || !password.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(AUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login: login.trim(), password: password.trim() }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error || 'Неверный логин или пароль');
        return;
      }
      // 2FA выключена (MAX_BOT_ADMIN_CHAT_ID не задан) — сразу входим
      if (data.token) {
        localStorage.setItem('auth_token', data.token);
        onLogin(data.token);
        return;
      }
      // 2FA включена — переходим к вводу кода
      setStep('code');
      setResendTimer(60);
      setTimeout(() => codeRefs.current[0]?.focus(), 100);
    } catch {
      setError('Ошибка соединения. Попробуйте позже.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCode(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const codeStr = code.join('');
    if (codeStr.length < 6) return;
    setLoading(true);
    try {
      const res = await fetch(AUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login: login.trim(), password: password.trim(), code: codeStr }),
      });
      const data = await res.json();
      if (data.ok && data.token) {
        localStorage.setItem('auth_token', data.token);
        onLogin(data.token);
      } else {
        setError(data.error || 'Неверный код');
        setCode(['', '', '', '', '', '']);
        setTimeout(() => codeRefs.current[0]?.focus(), 50);
      }
    } catch {
      setError('Ошибка соединения. Попробуйте позже.');
    } finally {
      setLoading(false);
    }
  }

  function handleCodeInput(i: number, val: string) {
    const digit = val.replace(/\D/g, '').slice(-1);
    const next = [...code];
    next[i] = digit;
    setCode(next);
    setError('');
    if (digit && i < 5) codeRefs.current[i + 1]?.focus();
  }

  function handleCodeKeyDown(i: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !code[i] && i > 0) {
      codeRefs.current[i - 1]?.focus();
    }
  }

  async function handleResend() {
    if (resendTimer > 0) return;
    setError('');
    setCode(['', '', '', '', '', '']);
    setLoading(true);
    try {
      const res = await fetch(AUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login: login.trim(), password: password.trim() }),
      });
      const data = await res.json();
      if (data.ok) {
        setResendTimer(60);
        setTimeout(() => codeRefs.current[0]?.focus(), 50);
      } else {
        setError(data.error || 'Ошибка отправки кода');
      }
    } catch {
      setError('Ошибка соединения.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <Icon name="TrendingUp" size={22} className="text-primary" />
          </div>
          <h1 className="text-xl font-semibold text-foreground">ФинансПро</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {step === 'credentials' ? 'Введите данные для входа' : 'Введите код из Max-бота'}
          </p>
        </div>

        {/* Step 1 — credentials */}
        {step === 'credentials' && (
          <form onSubmit={handleCredentials} className="stat-card space-y-4">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Логин</label>
              <input
                type="text"
                autoComplete="username"
                placeholder="admin"
                className="fin-input w-full"
                value={login}
                onChange={e => { setLogin(e.target.value); setError(''); }}
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Пароль</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="fin-input w-full pr-9"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Icon name={showPassword ? 'EyeOff' : 'Eye'} size={14} />
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 rounded px-3 py-2">
                <Icon name="AlertCircle" size={13} />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !login.trim() || !password.trim()}
              className="fin-btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading
                ? <><Icon name="Loader2" size={14} className="animate-spin" /> Проверка...</>
                : <><Icon name="LogIn" size={14} /> Войти</>
              }
            </button>
          </form>
        )}

        {/* Step 2 — 6-digit code */}
        {step === 'code' && (
          <form onSubmit={handleCode} className="stat-card space-y-5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-primary/5 rounded px-3 py-2.5">
              <Icon name="MessageCircle" size={14} className="text-primary flex-shrink-0" />
              Код отправлен в ваш Max-бот. Проверьте сообщения.
            </div>

            <div>
              <label className="block text-xs text-muted-foreground mb-3">Код подтверждения</label>
              <div className="flex gap-2 justify-between">
                {code.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => { codeRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleCodeInput(i, e.target.value)}
                    onKeyDown={e => handleCodeKeyDown(i, e)}
                    className="w-11 h-12 text-center text-lg font-mono-ibm fin-input p-0 focus:ring-1 focus:ring-primary"
                  />
                ))}
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 rounded px-3 py-2">
                <Icon name="AlertCircle" size={13} />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || code.join('').length < 6}
              className="fin-btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading
                ? <><Icon name="Loader2" size={14} className="animate-spin" /> Проверка...</>
                : <><Icon name="ShieldCheck" size={14} /> Подтвердить</>
              }
            </button>

            <div className="flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => { setStep('credentials'); setError(''); setCode(['','','','','','']); }}
                className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                <Icon name="ArrowLeft" size={12} /> Назад
              </button>
              <button
                type="button"
                onClick={handleResend}
                disabled={resendTimer > 0 || loading}
                className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
              >
                {resendTimer > 0 ? `Отправить снова (${resendTimer}с)` : 'Отправить снова'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
