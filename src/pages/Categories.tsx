import { useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';
import { api, Category, Transaction } from '@/lib/api';
import { formatCurrency } from '@/data/mockData';

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'income' | 'expense'>('income');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'income', color: '#22c55e', icon: 'Tag' });

  useEffect(() => {
    Promise.all([api.categories.list(), api.transactions.list()])
      .then(([catRes, txRes]) => {
        setCategories(catRes.categories);
        setTransactions(txRes.transactions);
      })
      .finally(() => setLoading(false));
  }, []);

  const list = categories.filter(c => c.type === activeTab);

  function getCatTotal(id: number) {
    return transactions.filter(t => t.category_id === id).reduce((s, t) => s + t.amount, 0);
  }
  function getCatCount(id: number) {
    return transactions.filter(t => t.category_id === id).length;
  }

  async function handleCreate() {
    if (!form.name) return;
    setSaving(true);
    try {
      const created = await api.categories.create(form);
      setCategories(prev => [...prev, created]);
      setForm({ name: '', type: 'income', color: '#22c55e', icon: 'Tag' });
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
          <h1 className="text-xl font-semibold text-foreground">Категории</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Управление классификацией транзакций</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="fin-btn-primary flex items-center gap-2">
          <Icon name={showForm ? 'X' : 'Plus'} size={14} />
          {showForm ? 'Отмена' : 'Новая категория'}
        </button>
      </div>

      <div className="flex gap-1 bg-secondary p-1 rounded-md w-fit">
        {(['income', 'expense'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded text-sm font-medium transition-all ${activeTab === tab ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {tab === 'income' ? 'Доходы' : 'Расходы'}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="stat-card border-primary/30 animate-fade-in">
          <div className="section-title mb-4">Новая категория</div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Название</label>
              <input type="text" placeholder="Название категории" className="fin-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Тип</label>
              <select className="fin-input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                <option value="income">Доход</option>
                <option value="expense">Расход</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Цвет</label>
              <div className="flex items-center gap-2">
                <input type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} className="w-10 h-9 rounded border border-border bg-muted cursor-pointer" />
                <input type="text" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} className="fin-input font-mono-ibm flex-1" />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setShowForm(false)} className="fin-btn-secondary">Отмена</button>
            <button onClick={handleCreate} disabled={saving || !form.name} className="fin-btn-primary flex items-center gap-2">
              {saving ? <Icon name="Loader2" size={14} className="animate-spin" /> : <Icon name="Check" size={14} />}
              {saving ? 'Создание...' : 'Создать'}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {list.length === 0 && (
          <div className="col-span-2 py-12 text-center text-sm text-muted-foreground">
            Нет категорий. Создайте первую.
          </div>
        )}
        {list.map((cat) => {
          const total = getCatTotal(cat.id);
          const count = getCatCount(cat.id);
          return (
            <div key={cat.id} className="stat-card group">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-md flex items-center justify-center" style={{ backgroundColor: cat.color + '20' }}>
                    <Icon name={cat.icon} size={16} style={{ color: cat.color }} fallback="Tag" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground">{cat.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{count} транзакций</div>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-muted-foreground">Объём</span>
                  <span className={`text-sm font-mono-ibm font-medium ${activeTab === 'income' ? 'text-income' : 'text-expense'}`}>
                    {formatCurrency(total)}
                  </span>
                </div>
                <div className="h-1 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: total > 0 ? '60%' : '0%', backgroundColor: cat.color }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
