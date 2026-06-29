import { useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';
import { api } from '@/lib/api';

interface WhitelistEntry {
  id: number;
  phone: string;
  name: string;
  user_id: number | null;
  is_active: boolean;
  created_at: string;
}

function formatPhone(phone: string) {
  const d = phone.replace(/\D/g, '');
  if (d.length === 11) {
    return `+${d[0]} (${d.slice(1,4)}) ${d.slice(4,7)}-${d.slice(7,9)}-${d.slice(9,11)}`;
  }
  return phone;
}

function normalizePhone(raw: string) {
  const digits = raw.replace(/\D/g, '');
  const norm = digits.startsWith('8') && digits.length === 11 ? '7' + digits.slice(1) : digits;
  return '+' + norm;
}

export default function BotAccess() {
  const [list, setList] = useState<WhitelistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ phone: '', name: '' });
  const [togglingId, setTogglingId] = useState<number | null>(null);

  useEffect(() => { loadList(); }, []);

  function loadList() {
    setLoading(true);
    api.whitelist.list()
      .then(res => setList(res.whitelist))
      .finally(() => setLoading(false));
  }

  async function handleAdd() {
    if (!form.phone.trim()) return;
    setSaving(true);
    try {
      const created = await api.whitelist.create({ phone: form.phone.trim(), name: form.name.trim() });
      setList(prev => [created, ...prev.filter(e => e.phone !== created.phone)]);
      setForm({ phone: '', name: '' });
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(entry: WhitelistEntry) {
    setTogglingId(entry.id);
    try {
      const updated = await api.whitelist.update(entry.id, { is_active: !entry.is_active });
      setList(prev => prev.map(e => e.id === entry.id ? { ...e, ...updated } : e));
    } finally {
      setTogglingId(null);
    }
  }

  const active = list.filter(e => e.is_active);
  const inactive = list.filter(e => !e.is_active);

  return (
    <div className="p-6 space-y-6 animate-fade-in max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Доступ к боту</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Список номеров с доступом к боту Max</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="fin-btn-primary flex items-center gap-2">
          <Icon name={showForm ? 'X' : 'Plus'} size={14} />
          {showForm ? 'Отмена' : 'Добавить номер'}
        </button>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 bg-primary/5 border border-primary/20 rounded-md px-4 py-3">
        <Icon name="Info" size={15} className="text-primary mt-0.5 flex-shrink-0" />
        <div className="text-xs text-muted-foreground leading-relaxed">
          {list.filter(e => e.is_active).length === 0
            ? <><span className="text-amber-400 font-medium">Список пуст — бот доступен всем.</span> Добавьте хотя бы один номер, чтобы включить ограничение доступа.</>
            : <><span className="text-income font-medium">Ограничение активно.</span> Бот отвечает только номерам из этого списка. Остальные получат сообщение об отказе в доступе.</>
          }
        </div>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="stat-card border-primary/30 animate-fade-in">
          <div className="section-title mb-4">Новый номер</div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Номер телефона *</label>
              <input
                type="tel"
                placeholder="+7 900 000-00-00"
                className="fin-input font-mono-ibm"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
              />
              {form.phone.replace(/\D/g,'').length >= 10 && (
                <div className="text-[10px] text-muted-foreground mt-1 font-mono-ibm">
                  → {normalizePhone(form.phone)}
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Имя / описание</label>
              <input
                type="text"
                placeholder="Например: Иванов А.И."
                className="fin-input"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => { setShowForm(false); setForm({ phone: '', name: '' }); }} className="fin-btn-secondary">
              Отмена
            </button>
            <button
              onClick={handleAdd}
              disabled={saving || form.phone.replace(/\D/g,'').length < 10}
              className="fin-btn-primary flex items-center gap-2"
            >
              {saving ? <Icon name="Loader2" size={14} className="animate-spin" /> : <Icon name="Plus" size={14} />}
              {saving ? 'Добавление...' : 'Добавить'}
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="stat-card">
          <div className="section-title mb-2">Разрешённых</div>
          <div className="text-2xl font-mono-ibm font-semibold text-income">{active.length}</div>
          <div className="text-xs text-muted-foreground mt-1">активных номеров</div>
        </div>
        <div className="stat-card">
          <div className="section-title mb-2">Привязанных</div>
          <div className="text-2xl font-mono-ibm font-semibold text-foreground">
            {list.filter(e => e.is_active && e.user_id).length}
          </div>
          <div className="text-xs text-muted-foreground mt-1">уже писали боту</div>
        </div>
        <div className="stat-card">
          <div className="section-title mb-2">Отключённых</div>
          <div className="text-2xl font-mono-ibm font-semibold text-muted-foreground">{inactive.length}</div>
          <div className="text-xs text-muted-foreground mt-1">заблокировано</div>
        </div>
      </div>

      {/* Table */}
      <div className="stat-card">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-foreground">Список номеров</span>
          {list.length > 0 && (
            <span className="text-xs text-muted-foreground">{list.length} записей</span>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-sm text-muted-foreground gap-2">
            <Icon name="Loader2" size={15} className="animate-spin" />
            Загрузка...
          </div>
        ) : list.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Список пуст. Добавьте первый номер.
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-2 text-xs text-muted-foreground font-medium">Номер</th>
                <th className="text-left py-2 px-2 text-xs text-muted-foreground font-medium">Имя</th>
                <th className="text-left py-2 px-2 text-xs text-muted-foreground font-medium">Статус</th>
                <th className="text-left py-2 px-2 text-xs text-muted-foreground font-medium">В боте</th>
                <th className="w-16" />
              </tr>
            </thead>
            <tbody>
              {list.map(entry => (
                <tr key={entry.id} className="border-b border-border/40 hover:bg-secondary/30 transition-colors">
                  <td className="py-3 px-2 font-mono-ibm text-sm text-foreground">
                    {formatPhone(entry.phone)}
                  </td>
                  <td className="py-3 px-2 text-sm text-muted-foreground">
                    {entry.name || <span className="text-muted-foreground/40">—</span>}
                  </td>
                  <td className="py-3 px-2">
                    {entry.is_active ? (
                      <span className="badge-income">Разрешён</span>
                    ) : (
                      <span className="badge-expense">Заблокирован</span>
                    )}
                  </td>
                  <td className="py-3 px-2">
                    {entry.user_id ? (
                      <span className="flex items-center gap-1 text-xs text-income">
                        <Icon name="CheckCircle" size={12} />
                        Привязан
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground/50">Ещё не писал</span>
                    )}
                  </td>
                  <td className="py-3 px-2">
                    <button
                      onClick={() => toggleActive(entry)}
                      disabled={togglingId === entry.id}
                      title={entry.is_active ? 'Заблокировать' : 'Разрешить'}
                      className={`w-7 h-7 flex items-center justify-center rounded transition-colors text-muted-foreground
                        ${entry.is_active
                          ? 'hover:bg-red-500/10 hover:text-red-400'
                          : 'hover:bg-emerald-500/10 hover:text-emerald-400'}`}
                    >
                      {togglingId === entry.id
                        ? <Icon name="Loader2" size={13} className="animate-spin" />
                        : <Icon name={entry.is_active ? 'UserX' : 'UserCheck'} size={13} />
                      }
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
