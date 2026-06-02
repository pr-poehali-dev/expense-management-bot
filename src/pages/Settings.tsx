import { useState } from 'react';
import Icon from '@/components/ui/icon';

export default function Settings() {
  const [profile, setProfile] = useState({ name: 'Иванов Андрей Игоревич', email: 'ivanov@company.ru', currency: 'RUB', timezone: 'Europe/Moscow' });
  const [notifications, setNotifications] = useState({ reminders: true, weeklyReport: true, budgetAlerts: false, chatTips: true });
  const [saved, setSaved] = useState(false);

  function handleSave() {
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
