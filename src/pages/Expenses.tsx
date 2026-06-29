import { useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';
import { api, Transaction, Category, Client } from '@/lib/api';
import { formatCurrency, formatDate } from '@/data/mockData';

export default function Expenses() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ amount: '', category_id: '', client_id: '', description: '', date: '' });
  const [search, setSearch] = useState('');

  useEffect(() => {
    Promise.all([
      api.transactions.list('expense'),
      api.categories.list('expense'),
      api.clients.list(),
    ]).then(([txRes, catRes, clRes]) => {
      setTransactions(txRes.transactions);
      setCategories(catRes.categories);
      setClients(clRes.clients);
      if (catRes.categories.length > 0) {
        setForm(f => ({ ...f, category_id: String(catRes.categories[0].id) }));
      }
    }).finally(() => setLoading(false));
  }, []);

  const total = transactions.reduce((s, t) => s + t.amount, 0);
  const filtered = transactions.filter(t =>
    t.description.toLowerCase().includes(search.toLowerCase()) ||
    (t.category_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (t.client_last_name ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const byCat = categories.map(cat => ({
    ...cat,
    total: transactions.filter(t => t.category_id === cat.id).reduce((s, t) => s + t.amount, 0),
  })).filter(c => c.total > 0).sort((a, b) => b.total - a.total);
  const maxCat = byCat[0]?.total ?? 1;

  async function handleSave() {
    if (!form.amount || !form.description) return;
    setSaving(true);
    try {
      const created = await api.transactions.create({
        type: 'expense',
        amount: parseFloat(form.amount),
        category_id: form.category_id ? parseInt(form.category_id) : null,
        client_id: form.client_id ? parseInt(form.client_id) : null,
        description: form.description,
        date: form.date || new Date().toISOString().split('T')[0],
      });
      const cat = categories.find(c => c.id === created.category_id);
      const cli = clients.find(c => c.id === created.client_id);
      setTransactions(prev => [{
        ...created,
        category_name: cat?.name ?? null,
        category_color: cat?.color ?? null,
        category_icon: cat?.icon ?? null,
        client_last_name: cli?.last_name ?? null,
        client_first_name: cli?.first_name ?? null,
        client_middle_name: cli?.middle_name ?? null,
      }, ...prev]);
      setForm({ amount: '', category_id: categories[0] ? String(categories[0].id) : '', client_id: '', description: '', date: '' });
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-muted-foreground text-sm">
          <Icon name="Loader2" size={16} className="animate-spin" />
          Загрузка...
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Расходы</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Контроль и анализ трат</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="fin-btn-primary flex items-center gap-2">
          <Icon name={showForm ? 'X' : 'Plus'} size={14} />
          {showForm ? 'Отмена' : 'Добавить расход'}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="section-title mb-2">Итого</div>
          <div className="text-xl font-mono-ibm font-semibold text-expense">{formatCurrency(total)}</div>
          <div className="text-xs text-muted-foreground mt-1">{transactions.length} транзакций</div>
        </div>
        <div className="stat-card col-span-2">
          <div className="section-title mb-4">По категориям</div>
          <div className="space-y-2.5">
            {byCat.slice(0, 5).map(cat => (
              <div key={cat.id} className="flex items-center gap-3">
                <div className="w-24 text-xs text-muted-foreground truncate">{cat.name}</div>
                <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-red-500/60 transition-all duration-500" style={{ width: `${(cat.total / maxCat) * 100}%` }} />
                </div>
                <div className="w-24 text-right text-xs font-mono-ibm text-foreground">{formatCurrency(cat.total)}</div>
              </div>
            ))}
            {byCat.length === 0 && <div className="text-xs text-muted-foreground">Нет данных</div>}
          </div>
        </div>
      </div>

      {showForm && (
        <div className="stat-card border-destructive/30 animate-fade-in">
          <div className="section-title mb-4">Новая запись о расходе</div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Сумма (₽)</label>
              <input type="number" placeholder="0" className="fin-input font-mono-ibm" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Категория</label>
              <select className="fin-input" value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Описание</label>
              <input type="text" placeholder="На что потрачено..." className="fin-input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Дата</label>
              <input type="date" className="fin-input" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-muted-foreground mb-1.5">Клиент <span className="text-muted-foreground/60">(необязательно)</span></label>
              <select className="fin-input" value={form.client_id} onChange={e => setForm({ ...form, client_id: e.target.value })}>
                <option value="">— Без клиента —</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.last_name} {c.first_name} {c.middle_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setShowForm(false)} className="fin-btn-secondary">Отмена</button>
            <button onClick={handleSave} disabled={saving || !form.amount || !form.description} className="fin-btn-primary flex items-center gap-2">
              {saving ? <Icon name="Loader2" size={14} className="animate-spin" /> : <Icon name="Check" size={14} />}
              {saving ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </div>
      )}

      <div className="stat-card">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-foreground">Все расходы</span>
          <div className="relative">
            <Icon name="Search" size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type="text" placeholder="Поиск..." className="fin-input pl-8 w-48 h-8 text-xs" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-2 text-xs text-muted-foreground font-medium">Дата</th>
                <th className="text-left py-2 px-2 text-xs text-muted-foreground font-medium">Описание</th>
                <th className="text-left py-2 px-2 text-xs text-muted-foreground font-medium">Категория</th>
                <th className="text-left py-2 px-2 text-xs text-muted-foreground font-medium">Клиент</th>
                <th className="text-right py-2 px-2 text-xs text-muted-foreground font-medium">Сумма</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="py-8 text-center text-xs text-muted-foreground">Транзакции не найдены</td></tr>
              )}
              {filtered.map((t) => (
                <tr key={t.id} className="border-b border-border/40 hover:bg-secondary/30 transition-colors">
                  <td className="py-3 px-2 text-xs text-muted-foreground font-mono-ibm">{formatDate(t.date)}</td>
                  <td className="py-3 px-2 text-sm text-foreground">{t.description}</td>
                  <td className="py-3 px-2"><span className="badge-expense">{t.category_name ?? '—'}</span></td>
                  <td className="py-3 px-2">
                    {t.client_last_name ? (
                      <span className="text-xs text-muted-foreground">
                        {t.client_last_name} {t.client_first_name}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground/40">—</span>
                    )}
                  </td>
                  <td className="py-3 px-2 text-right font-mono-ibm text-sm text-expense font-medium">−{formatCurrency(t.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
