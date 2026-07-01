import { useState } from 'react';
import Icon from '@/components/ui/icon';

interface Props {
  onLogin: (token: string) => void;
}

export default function Login({ onLogin }: Props) {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!login.trim() || !password.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(
        'https://functions.poehali.dev/75d2f0e5-b484-411b-aed7-af7a2eefc6ac',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ login: login.trim(), password: password.trim() }),
        }
      );
      const data = await res.json();
      if (data.ok && data.token) {
        localStorage.setItem('auth_token', data.token);
        onLogin(data.token);
      } else {
        setError(data.error || 'Неверный логин или пароль');
      }
    } catch {
      setError('Ошибка соединения. Попробуйте позже.');
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
          <p className="text-sm text-muted-foreground mt-1">Введите данные для входа</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="stat-card space-y-4">
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
              ? <><Icon name="Loader2" size={14} className="animate-spin" /> Вход...</>
              : <><Icon name="LogIn" size={14} /> Войти</>
            }
          </button>
        </form>
      </div>
    </div>
  );
}