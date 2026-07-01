import { useState } from 'react';
import Icon from '@/components/ui/icon';

const SCHEDULER_URL = "https://functions.poehali.dev/40fefc06-49c5-4ebd-85e7-e0b7b598224e";

export default function Settings() {
  const [profile, setProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('settings_profile');
      return saved ? JSON.parse(saved) : { name: 'Иванов Андрей Игоревич', email: 'ivanov@company.ru', currency: 'RUB', timezone: 'Europe/Moscow' };
    } catch { return { name: 'Иванов Андрей Игоревич', email: 'ivanov@company.ru', currency: 'RUB', timezone: 'Europe/Moscow' }; }
  });
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem('settings_notifications');
      return saved ? JSON.parse(saved) : { reminders: true, weeklyReport: true, budgetAlerts: false, chatTips: true };
    } catch { return { reminders: true, weeklyReport: true, budgetAlerts: false, chatTips: true }; }
  });
  const [saved, setSaved] = useState(false);
  const [schedulerRunning, setSchedulerRunning] = useState(false);
  const [schedulerResult, setSchedulerResult] = useState<{ sent: number; clients_today: number; total_amount?: number } | null>(null);

  async function runScheduler() {
    setSchedulerRunning(true);
    setSchedulerResult(null);
    try {
      const res = await fetch(SCHEDULER_URL);
      const text = await res.text();
      const data = JSON.parse(typeof JSON.parse(text) === 'string' ? JSON.parse(text) : text);
      setSchedulerResult(data);
    } catch {
      setSchedulerResult(null);
    } finally {
      setSchedulerRunning(false);
    }
  }

  function handleSave() {
    localStorage.setItem('settings_profile', JSON.stringify(profile));
    localStorage.setItem('settings_notifications', JSON.stringify(notifications));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Настройки</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Профиль пользователя и параметры системы</p>
      </div>

      {/* Profile */}
      <div className="stat-card space-y-4">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-lg font-semibold text-foreground">
            АИ
          </div>
          <div>
            <div className="text-sm font-medium text-foreground">{profile.name}</div>
            <div className="text-xs text-muted-foreground">{profile.email}</div>
          </div>
          <button className="ml-auto fin-btn-secondary text-xs flex items-center gap-1.5">
            <Icon name="Camera" size={12} />
            Фото
          </button>
        </div>

        <div className="section-title mb-3">Профиль</div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Полное имя</label>
            <input className="fin-input" value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Email</label>
            <input className="fin-input" type="email" value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Валюта</label>
            <select className="fin-input" value={profile.currency} onChange={e => setProfile({ ...profile, currency: e.target.value })}>
              <option value="RUB">Российский рубль (₽)</option>
              <option value="USD">Доллар США ($)</option>
              <option value="EUR">Евро (€)</option>
              <option value="CNY">Китайский юань (¥)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Часовой пояс</label>
            <select className="fin-input" value={profile.timezone} onChange={e => setProfile({ ...profile, timezone: e.target.value })}>
              <option value="Europe/Moscow">Москва (UTC+3)</option>
              <option value="Europe/Kaliningrad">Калининград (UTC+2)</option>
              <option value="Asia/Yekaterinburg">Екатеринбург (UTC+5)</option>
              <option value="Asia/Novosibirsk">Новосибирск (UTC+7)</option>
              <option value="Asia/Vladivostok">Владивосток (UTC+10)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="stat-card">
        <div className="section-title mb-4">Уведомления</div>
        <div className="space-y-3">
          {[
            { key: 'reminders', label: 'Напоминания о платежах', desc: 'За 3 дня до срока оплаты' },
            { key: 'weeklyReport', label: 'Еженедельный отчёт', desc: 'Сводка по понедельникам' },
            { key: 'budgetAlerts', label: 'Превышение бюджета', desc: 'При достижении лимита категории' },
            { key: 'chatTips', label: 'Советы ассистента', desc: 'Персональные финансовые рекомендации' },
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
              <div>
                <div className="text-sm text-foreground">{item.label}</div>
                <div className="text-xs text-muted-foreground">{item.desc}</div>
              </div>
              <button
                onClick={() => setNotifications(prev => ({ ...prev, [item.key]: !prev[item.key as keyof typeof prev] }))}
                className={`w-10 h-5 rounded-full transition-all duration-200 relative ${notifications[item.key as keyof typeof notifications] ? 'bg-primary' : 'bg-secondary border border-border'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${notifications[item.key as keyof typeof notifications] ? 'right-0.5' : 'left-0.5'}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Max Bot Scheduler */}
      <div className="stat-card">
        <div className="flex items-center gap-2 mb-1">
          <Icon name="Bot" size={14} className="text-primary" />
          <span className="section-title">Бот Max — уведомления об оплате</span>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Бот автоматически отправляет напоминания всем авторизованным пользователям
          в день оплаты каждого клиента. Запускается ежедневно в 9:00.
        </p>

        <div className="bg-secondary/40 rounded-md px-3 py-2.5 mb-4">
          <div className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">URL для внешнего cron (запускать в 9:00 каждый день)</div>
          <div className="font-mono-ibm text-xs text-foreground break-all select-all">{SCHEDULER_URL}</div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={runScheduler}
            disabled={schedulerRunning}
            className="fin-btn-secondary flex items-center gap-2"
          >
            {schedulerRunning
              ? <Icon name="Loader2" size={13} className="animate-spin" />
              : <Icon name="Play" size={13} />}
            {schedulerRunning ? 'Отправка...' : 'Запустить сейчас'}
          </button>
          {schedulerResult && (
            <span className="text-xs text-income animate-fade-in flex items-center gap-1">
              <Icon name="CheckCircle" size={12} />
              {schedulerResult.clients_today === 0
                ? 'Сегодня нет клиентов с оплатой'
                : `Отправлено ${schedulerResult.sent} уведомл. · ${schedulerResult.clients_today} клиентов`}
            </span>
          )}
        </div>
      </div>

      {/* Security */}
      <div className="stat-card">
        <div className="section-title mb-4">Безопасность</div>
        <div className="space-y-2">
          <button className="w-full fin-btn-secondary flex items-center gap-2 justify-start">
            <Icon name="Lock" size={14} />
            Изменить пароль
          </button>
          <button className="w-full fin-btn-secondary flex items-center gap-2 justify-start">
            <Icon name="Shield" size={14} />
            Двухфакторная аутентификация
          </button>
          <button className="w-full fin-btn-secondary flex items-center gap-2 justify-start">
            <Icon name="Download" size={14} />
            Экспорт данных (CSV)
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={handleSave} className="fin-btn-primary flex items-center gap-2">
          <Icon name={saved ? 'Check' : 'Save'} size={14} />
          {saved ? 'Сохранено!' : 'Сохранить изменения'}
        </button>
        {saved && <span className="text-xs text-income animate-fade-in">Настройки успешно обновлены</span>}
      </div>
    </div>
  );
}