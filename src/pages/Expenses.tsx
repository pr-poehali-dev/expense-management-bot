import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { transactions, categories, formatCurrency, formatDate } from '@/data/mockData';

const expenseList = transactions.filter(t => t.type === 'expense');

function getCategoryName(id: string) {
  return categories.expense.find(c => c.id === id)?.name ?? id;
}

export default function Expenses() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ amount: '', category: 'food', description: '', date: '' });

  const total = expenseList.reduce((s, t) => s + t.amount, 0);

  const byCat = categories.expense.map(cat => ({
    ...cat,
    total: expenseList.filter(t => t.category === cat.id).reduce((s, t) => s + t.amount, 0),
  })).filter(c => c.total > 0).sort((a, b) => b.total - a.total);

  const maxCat = byCat[0]?.total ?? 1;

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
        {/* Total */}
        <div className="stat-card">
          <div className="section-title mb-2">Итого за период</div>
          <div className="text-xl font-mono-ibm font-semibold text-expense">{formatCurrency(total)}</div>
          <div className="text-xs text-muted-foreground mt-1.5">{expenseList.length} транзакций</div>
        </div>

        {/* By category bar chart */}
        <div className="stat-card col-span-2">
          <div className="section-title mb-4">Распределение по категориям</div>
          <div className="space-y-2.5">
            {byCat.slice(0, 5).map(cat => (
              <div key={cat.id} className="flex items-center gap-3">
                <div className="w-24 text-xs text-muted-foreground truncate">{cat.name}</div>
                <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-red-500/60 transition-all duration-500"
                    style={{ width: `${(cat.total / maxCat) * 100}%` }}
                  />
                </div>
                <div className="w-24 text-right text-xs font-mono-ibm text-foreground">{formatCurrency(cat.total)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="stat-card border-destructive/30 animate-fade-in">
          <div className="section-title mb-4">Новая запись о расходе</div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Сумма (₽)</label>
              <input
                type="number"
                placeholder="0"
                className="fin-input font-mono-ibm"
                value={form.amount}
                onChange={e => setForm({ ...form, amount: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Категория</label>
              <select
                className="fin-input"
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
              >
                {categories.expense.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Описание</label>
              <input
                type="text"
                placeholder="На что потрачено..."
                className="fin-input"
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Дата</label>
              <input
                type="date"
                className="fin-input"
                value={form.date}
                onChange={e => setForm({ ...form, date: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setShowForm(false)} className="fin-btn-secondary">Отмена</button>
            <button className="fin-btn-primary flex items-center gap-2">
              <Icon name="Check" size={14} />
              Сохранить
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="stat-card">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-foreground">Все расходы</span>
          <div className="relative">
            <Icon name="Search" size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type="text" placeholder="Поиск..." className="fin-input pl-8 w-48 h-8 text-xs" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-2 text-xs text-muted-foreground font-medium">Дата</th>
                <th className="text-left py-2 px-2 text-xs text-muted-foreground font-medium">Описание</th>
                <th className="text-left py-2 px-2 text-xs text-muted-foreground font-medium">Категория</th>
                <th className="text-right py-2 px-2 text-xs text-muted-foreground font-medium">Сумма</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {expenseList.map((t) => (
                <tr key={t.id} className="border-b border-border/40 hover:bg-secondary/30 transition-colors">
                  <td className="py-3 px-2 text-xs text-muted-foreground font-mono-ibm">{formatDate(t.date)}</td>
                  <td className="py-3 px-2 text-sm text-foreground">{t.description}</td>
                  <td className="py-3 px-2">
                    <span className="badge-expense">{getCategoryName(t.category)}</span>
                  </td>
                  <td className="py-3 px-2 text-right font-mono-ibm text-sm text-expense font-medium">−{formatCurrency(t.amount)}</td>
                  <td className="py-3 px-2">
                    <button className="w-6 h-6 flex items-center justify-center rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                      <Icon name="MoreHorizontal" size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
