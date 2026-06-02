import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { transactions, monthlyData, categories, formatCurrency } from '@/data/mockData';

const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
const savingsRate = Math.round(((totalIncome - totalExpense) / totalIncome) * 100);

const maxMonth = Math.max(...monthlyData.map(m => m.income));

const expenseByCat = categories.expense.map(cat => ({
  ...cat,
  total: transactions.filter(t => t.type === 'expense' && t.category === cat.id).reduce((s, t) => s + t.amount, 0),
})).filter(c => c.total > 0).sort((a, b) => b.total - a.total);

const incomeByCat = categories.income.map(cat => ({
  ...cat,
  total: transactions.filter(t => t.type === 'income' && t.category === cat.id).reduce((s, t) => s + t.amount, 0),
})).filter(c => c.total > 0).sort((a, b) => b.total - a.total);

export default function Analytics() {
  const [view, setView] = useState<'month' | 'category'>('month');

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Аналитика</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Финансовые отчёты и показатели</p>
        </div>
        <div className="flex gap-1 bg-secondary p-1 rounded-md">
          {(['month', 'category'] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${view === v ? 'bg-card text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {v === 'month' ? 'По месяцам' : 'По категориям'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Доходы', value: formatCurrency(totalIncome), sub: 'за период', color: 'text-income', icon: 'TrendingUp' },
          { label: 'Расходы', value: formatCurrency(totalExpense), sub: 'за период', color: 'text-expense', icon: 'TrendingDown' },
          { label: 'Чистая прибыль', value: formatCurrency(totalIncome - totalExpense), sub: 'сбережения', color: 'text-primary', icon: 'PiggyBank' },
          { label: 'Норма сбережений', value: `${savingsRate}%`, sub: 'от дохода', color: 'text-foreground', icon: 'Percent' },
        ].map(kpi => (
          <div key={kpi.label} className="stat-card">
            <div className="flex items-center justify-between mb-2">
              <span className="section-title">{kpi.label}</span>
              <Icon name={kpi.icon} size={13} className="text-muted-foreground" />
            </div>
            <div className={`text-xl font-mono-ibm font-semibold ${kpi.color}`}>{kpi.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{kpi.sub}</div>
          </div>
        ))}
      </div>

      {view === 'month' ? (
        <div className="stat-card">
          <div className="flex items-center justify-between mb-6">
            <span className="text-sm font-medium text-foreground">Доходы vs Расходы по месяцам</span>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/50 inline-block" />Доходы</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-red-500/50 inline-block" />Расходы</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-primary/50 inline-block" />Баланс</span>
            </div>
          </div>
          <div className="flex items-end gap-4 h-52">
            {monthlyData.map((m) => {
              const bal = m.income - m.expense;
              return (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex gap-1 items-end" style={{ height: '180px' }}>
                    <div
                      className="flex-1 bg-emerald-500/30 hover:bg-emerald-500/50 rounded-t-sm transition-all cursor-pointer border-t-2 border-emerald-500/60"
                      style={{ height: `${(m.income / maxMonth) * 100}%` }}
                      title={`Доходы: ${formatCurrency(m.income)}`}
                    />
                    <div
                      className="flex-1 bg-red-500/30 hover:bg-red-500/50 rounded-t-sm transition-all cursor-pointer border-t-2 border-red-500/60"
                      style={{ height: `${(m.expense / maxMonth) * 100}%` }}
                      title={`Расходы: ${formatCurrency(m.expense)}`}
                    />
                    <div
                      className="flex-1 bg-primary/25 hover:bg-primary/40 rounded-t-sm transition-all cursor-pointer border-t-2 border-primary/60"
                      style={{ height: `${(bal / maxMonth) * 100}%` }}
                      title={`Баланс: ${formatCurrency(bal)}`}
                    />
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground">{m.month}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div className="stat-card">
            <div className="text-sm font-medium text-foreground mb-5">Расходы по категориям</div>
            <div className="space-y-3">
              {expenseByCat.map(cat => (
                <div key={cat.id}>
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span className="text-xs text-foreground">{cat.name}</span>
                    </div>
                    <span className="text-xs font-mono-ibm text-muted-foreground">{formatCurrency(cat.total)}</span>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${(cat.total / expenseByCat[0].total) * 100}%`, backgroundColor: cat.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="stat-card">
            <div className="text-sm font-medium text-foreground mb-5">Доходы по категориям</div>
            <div className="space-y-3">
              {incomeByCat.map(cat => (
                <div key={cat.id}>
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span className="text-xs text-foreground">{cat.name}</span>
                    </div>
                    <span className="text-xs font-mono-ibm text-muted-foreground">{formatCurrency(cat.total)}</span>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${(cat.total / incomeByCat[0].total) * 100}%`, backgroundColor: cat.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Savings progress */}
      <div className="stat-card">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-foreground">Цель сбережений — 25% от дохода</span>
          <span className={`text-sm font-mono-ibm font-semibold ${savingsRate >= 25 ? 'text-income' : 'text-amber-400'}`}>{savingsRate}%</span>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${savingsRate >= 25 ? 'bg-emerald-500' : 'bg-amber-400'}`}
            style={{ width: `${Math.min(savingsRate / 25 * 100, 100)}%` }}
          />
        </div>
        <div className="flex justify-between mt-1.5 text-[10px] text-muted-foreground">
          <span>0%</span>
          <span>Цель: 25%</span>
        </div>
      </div>
    </div>
  );
}
