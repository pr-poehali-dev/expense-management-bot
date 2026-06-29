import { useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';
import { api, Client } from '@/lib/api';
import { formatCurrency, formatDate } from '@/data/mockData';

const emptyForm = {
  last_name: '',
  first_name: '',
  middle_name: '',
  monthly_cost: '',
  opened_at: '',
};

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [totalMonthly, setTotalMonthly] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);

  function loadClients(q = '') {
    setLoading(true);
    api.clients.list(q || undefined)
      .then(res => {
        setClients(res.clients);
        setTotalMonthly(res.total_monthly);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadClients(); }, []);

  function openCreate() {
    setEditId(null);
    setForm({ ...emptyForm, opened_at: new Date().toISOString().split('T')[0] });
    setShowForm(true);
  }

  function openEdit(c: Client) {
    setEditId(c.id);
    setForm({
      last_name: c.last_name,
      first_name: c.first_name,
      middle_name: c.middle_name,
      monthly_cost: String(c.monthly_cost),
      opened_at: c.opened_at,
    });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditId(null);
    setForm(emptyForm);
  }

  async function handleSave() {
    if (!form.last_name.trim() || !form.first_name.trim()) return;
    setSaving(true);
    const payload = {
      last_name: form.last_name.trim(),
      first_name: form.first_name.trim(),
      middle_name: form.middle_name.trim(),
      monthly_cost: parseFloat(form.monthly_cost) || 0,
      opened_at: form.opened_at || new Date().toISOString().split('T')[0],
    };
    try {
      if (editId !== null) {
        const updated = await api.clients.update(editId, payload);
        setClients(prev => prev.map(c => c.id === editId ? updated : c));
        const total = clients.reduce((s, c) => s + (c.id === editId ? updated.monthly_cost : c.monthly_cost), 0);
        setTotalMonthly(total);
      } else {
        const created = await api.clients.create(payload);
        setClients(prev => [...prev, created]);
        setTotalMonthly(prev => prev + created.monthly_cost);
      }
      closeForm();
    } finally {
      setSaving(false);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput);
    loadClients(searchInput);
  }

  function clearSearch() {
    setSearchInput('');
    setSearch('');
    loadClients('');
  }

  const fullName = (c: Client) =>
    [c.last_name, c.first_name, c.middle_name].filter(Boolean).join(' ');

  const initials = (c: Client) =>
    [c.last_name[0], c.first_name[0]].filter(Boolean).join('').toUpperCase();

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Клиенты</h1>
          <p className="text-sm text-muted-foreground mt-0.5">База клиентов и тарифы обслуживания</p>
        </div>
        <button onClick={openCreate} className="fin-btn-primary flex items-center gap-2">
          <Icon name="UserPlus" size={14} />
          Добавить клиента
        </button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="section-title">Всего клиентов</span>
            <div className="w-7 h-7 rounded bg-primary/10 flex items-center justify-center">
              <Icon name="Users" size={13} className="text-primary" />
            </div>
          </div>
          <div className="font-mono-ibm text-2xl font-semibold text-foreground">{clients.length}</div>
          <div className="text-xs text-muted-foreground mt-1.5">активных карточек</div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="section-title">Выручка в месяц</span>
            <div className="w-7 h-7 rounded bg-emerald-500/10 flex items-center justify-center">
              <Icon name="CircleDollarSign" size={13} className="text-emerald-400" />
            </div>
          </div>
          <div className="font-mono-ibm text-2xl font-semibold text-income">{formatCurrency(totalMonthly)}</div>
          <div className="text-xs text-muted-foreground mt-1.5">суммарно по клиентам</div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="section-title">Средний чек</span>
            <div className="w-7 h-7 rounded bg-primary/10 flex items-center justify-center">
              <Icon name="TrendingUp" size={13} className="text-primary" />
            </div>
          </div>
          <div className="font-mono-ibm text-2xl font-semibold text-foreground">
            {clients.length > 0 ? formatCurrency(totalMonthly / clients.length) : '—'}
          </div>
          <div className="text-xs text-muted-foreground mt-1.5">на одного клиента</div>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="stat-card border-primary/30 animate-fade-in">
          <div className="section-title mb-4">
            {editId !== null ? 'Редактирование клиента' : 'Новый клиент'}
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Фамилия *</label>
              <input
                type="text"
                placeholder="Иванов"
                className="fin-input"
                value={form.last_name}
                onChange={e => setForm({ ...form, last_name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Имя *</label>
              <input
                type="text"
                placeholder="Андрей"
                className="fin-input"
                value={form.first_name}
                onChange={e => setForm({ ...form, first_name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Отчество</label>
              <input
                type="text"
                placeholder="Игоревич"
                className="fin-input"
                value={form.middle_name}
                onChange={e => setForm({ ...form, middle_name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Стоимость в месяц (₽)</label>
              <input
                type="number"
                placeholder="0"
                className="fin-input font-mono-ibm"
                value={form.monthly_cost}
                onChange={e => setForm({ ...form, monthly_cost: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Дата открытия карточки</label>
              <input
                type="date"
                className="fin-input"
                value={form.opened_at}
                onChange={e => setForm({ ...form, opened_at: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={closeForm} className="fin-btn-secondary">Отмена</button>
            <button
              onClick={handleSave}
              disabled={saving || !form.last_name.trim() || !form.first_name.trim()}
              className="fin-btn-primary flex items-center gap-2"
            >
              {saving
                ? <Icon name="Loader2" size={14} className="animate-spin" />
                : <Icon name="Check" size={14} />}
              {saving ? 'Сохранение...' : editId !== null ? 'Сохранить' : 'Добавить'}
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="stat-card">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-foreground">Список клиентов</span>
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <div className="relative">
              <Icon name="Search" size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Поиск по ФИО..."
                className="fin-input pl-8 w-52 h-8 text-xs"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
              />
            </div>
            {search && (
              <button type="button" onClick={clearSearch} className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                <Icon name="X" size={12} />
                Сбросить
              </button>
            )}
          </form>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-sm text-muted-foreground gap-2">
            <Icon name="Loader2" size={15} className="animate-spin" />
            Загрузка...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-2 text-xs text-muted-foreground font-medium">Клиент</th>
                  <th className="text-left py-2 px-2 text-xs text-muted-foreground font-medium">ФИО полностью</th>
                  <th className="text-right py-2 px-2 text-xs text-muted-foreground font-medium">Стоимость/мес</th>
                  <th className="text-left py-2 px-2 text-xs text-muted-foreground font-medium">Дата открытия</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody>
                {clients.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-sm text-muted-foreground">
                      {search ? 'Клиенты не найдены' : 'Клиентов пока нет. Добавьте первого.'}
                    </td>
                  </tr>
                )}
                {clients.map((c) => (
                  <tr key={c.id} className="border-b border-border/40 hover:bg-secondary/30 transition-colors group">
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary flex-shrink-0">
                          {initials(c)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-foreground">{c.last_name} {c.first_name}</div>
                          {c.middle_name && <div className="text-[11px] text-muted-foreground">{c.middle_name}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-sm text-muted-foreground">{fullName(c)}</td>
                    <td className="py-3 px-2 text-right font-mono-ibm text-sm font-medium text-income">
                      {c.monthly_cost > 0 ? formatCurrency(c.monthly_cost) : '—'}
                    </td>
                    <td className="py-3 px-2 text-xs text-muted-foreground font-mono-ibm">
                      {formatDate(c.opened_at)}
                    </td>
                    <td className="py-3 px-2">
                      <button
                        onClick={() => openEdit(c)}
                        className="w-6 h-6 flex items-center justify-center rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Icon name="Pencil" size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {clients.length > 0 && !loading && (
          <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{clients.length} клиентов{search ? ' (результат поиска)' : ''}</span>
            <span className="text-xs font-medium text-foreground font-mono-ibm">
              Итого: <span className="text-income">{formatCurrency(totalMonthly)}</span>/мес
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
