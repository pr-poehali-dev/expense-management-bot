import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { transactions, monthlyData, reminders, categories, formatCurrency, formatDate } from '@/data/mockData';

const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
const balance = totalIncome - totalExpense;

const maxBar = Math.max(...monthlyData.map(m => m.income));

function getCategoryName(id: string, type: string) {
  const list = type === 'income' ? categories.income : categories.expense;
  return list.find(c => c.id === id)?.name ?? id;
}

export default function Dashboard() {
  const [period] = useState('Май 2026');
  const recent = transactions.slice(0, 6);

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Финансовый обзор</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{period} · Актуально на сегодня</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="fin-btn-secondary flex items-center gap-2">
            <Icon name="Download" size={14} />
            Экспорт
          </button>
          <button className="fin-btn-primary flex items-center gap-2">
            <Icon name="Plus" size={14} />
            Транзакция
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="section-title">Баланс</span>
            <div className="w-7 h-7 rounded bg-primary/10 flex items-center justify-center">
              <Icon name="Wallet" size={13} className="text-primary" />
            </div>
          </div>
          <div className="font-mono-ibm text-2xl font-semibold text-foreground">{formatCurrency(balance)}</div>
          <div className="flex items-center gap-1 mt-2 text-xs text-emerald-400">
            <Icon name="TrendingUp" size={11} />
            +12.4% к прошлому месяцу
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="section-title">Доходы</span>
            <div className="w-7 h-7 rounded bg-emerald-500/10 flex items-center justify-center">
              <Icon name="ArrowDownLeft" size={13} className="text-emerald-400" />
            </div>
          </div>
          <div className="font-mono-ibm text-2xl font-semibold text-income">{formatCurrency(totalIncome)}</div>
          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
            <Icon name="Calendar" size={11} />
            5 транзакций за месяц
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="section-title">Расходы</span>
            <div className="w-7 h-7 rounded bg-red-500/10 flex items-center justify-center">
              <Icon name="ArrowUpRight" size={13} className="text-red-400" />
            </div>
          </div>
          <div className="font-mono-ibm text-2xl font-semibold text-expense">{formatCurrency(totalExpense)}</div>
          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
            <Icon name="Calendar" size={11} />
            10 транзакций за месяц
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Chart */}
        <div className="col-span-2 stat-card">
          <div className="flex items-center justify-between mb-5">
            <span className="text-sm font-medium text-foreground">Динамика за 6 месяцев</span>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />Доходы</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" />Расходы</span>
            </div>
          </div>
          <div className="flex items-end gap-2 h-40">
            {monthlyData.map((m) => (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex gap-1 items-end" style={{ height: '120px' }}>
                  <div
                    className="flex-1 bg-emerald-500/25 hover:bg-emerald-500/40 rounded-sm transition-colors cursor-pointer relative group"
                    style={{ height: `${(m.income / maxBar) * 100}%` }}
                  >
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-card border border-border px-1.5 py-0.5 rounded text-[10px] font-mono-ibm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      {formatCurrency(m.income)}
                    </div>
                  </div>
                  <div
                    className="flex-1 bg-red-500/25 hover:bg-red-500/40 rounded-sm transition-colors cursor-pointer relative group"
                    style={{ height: `${(m.expense / maxBar) * 100}%` }}
                  >
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-card border border-border px-1.5 py-0.5 rounded text-[10px] font-mono-ibm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      {formatCurrency(m.expense)}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] text-muted-foreground">{m.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Reminders */}
        <div className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-foreground">Напоминания</span>
            <span className="text-[10px] bg-primary/15 text-primary px-1.5 py-0.5 rounded font-medium">{reminders.length}</span>
          </div>
          <div className="space-y-2">
            {reminders.map((r) => (
              <div key={r.id} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${r.status === 'overdue' ? 'bg-red-400' : 'bg-amber-400'}`} />
                  <div>
                    <div className="text-xs font-medium text-foreground">{r.title}</div>
                    <div className="text-[10px] text-muted-foreground">{formatDate(r.dueDate)}</div>
                  </div>
                </div>
                <div className="text-xs font-mono-ibm text-foreground">{formatCurrency(r.amount)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent transactions */}
      <div className="stat-card">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-foreground">Последние транзакции</span>
          <button className="text-xs text-primary hover:text-primary/80 transition-colors">Все транзакции →</button>
        </div>
        <div className="space-y-0.5">
          {recent.map((t) => (
            <div key={t.id} className="data-row">
              <div className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded flex items-center justify-center ${t.type === 'income' ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                  <Icon name={t.type === 'income' ? 'ArrowDownLeft' : 'ArrowUpRight'} size={12} className={t.type === 'income' ? 'text-emerald-400' : 'text-red-400'} />
                </div>
                <div>
                  <div className="text-sm text-foreground">{t.description}</div>
                  <div className="text-[11px] text-muted-foreground">{getCategoryName(t.category, t.type)} · {formatDate(t.date)}</div>
                </div>
              </div>
              <div className={`font-mono-ibm text-sm font-medium ${t.type === 'income' ? 'text-income' : 'text-expense'}`}>
                {t.type === 'income' ? '+' : '−'}{formatCurrency(t.amount)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
