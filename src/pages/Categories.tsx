import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { categories, transactions, formatCurrency } from '@/data/mockData';

export default function Categories() {
  const [activeTab, setActiveTab] = useState<'income' | 'expense'>('income');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'income', color: '#22c55e' });

  const list = categories[activeTab];

  function getCatTotal(id: string, type: string) {
    return transactions.filter(t => t.type === type && t.category === id).reduce((s, t) => s + t.amount, 0);
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

      {/* Tabs */}
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

      {/* New category form */}
      {showForm && (
        <div className="stat-card border-primary/30 animate-fade-in">
          <div className="section-title mb-4">Новая категория</div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Название</label>
              <input
                type="text"
                placeholder="Название категории"
                className="fin-input"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />
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
                <input type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })}
                  className="w-10 h-9 rounded border border-border bg-muted cursor-pointer" />
                <input type="text" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })}
                  className="fin-input font-mono-ibm flex-1" />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setShowForm(false)} className="fin-btn-secondary">Отмена</button>
            <button className="fin-btn-primary flex items-center gap-2">
              <Icon name="Check" size={14} />
              Создать
            </button>
          </div>
        </div>
      )}

      {/* Categories grid */}
      <div className="grid grid-cols-2 gap-3">
        {list.map((cat) => {
          const total = getCatTotal(cat.id, activeTab);
          const count = transactions.filter(t => t.type === activeTab && t.category === cat.id).length;
          return (
            <div key={cat.id} className="stat-card group">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-md flex items-center justify-center" style={{ backgroundColor: cat.color + '20' }}>
                    <Icon name={cat.icon} size={16} style={{ color: cat.color }} />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground">{cat.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{count} транзакций</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="w-6 h-6 flex items-center justify-center rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                    <Icon name="Pencil" size={12} />
                  </button>
                  <button className="w-6 h-6 flex items-center justify-center rounded hover:bg-destructive/10 text-muted-foreground hover:text-red-400 transition-colors">
                    <Icon name="Trash2" size={12} />
                  </button>
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
