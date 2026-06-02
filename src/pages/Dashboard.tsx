import { useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';
import { api, Transaction, Reminder } from '@/lib/api';
import { formatCurrency, formatDate } from '@/data/mockData';

export default function Dashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [monthly, setMonthly] = useState<{ month: string; month_key: string; income: number; expense: number }[]>([]);
  const [totals, setTotals] = useState({ total_income: 0, total_expense: 0, total_transactions: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.transactions.list(),
      api.reminders.list(),
      api.analytics.get(),
    ]).then(([txRes, remRes, analRes]) => {
      setTransactions(txRes.transactions);
      setReminders(remRes.reminders);
      setMonthly(analRes.monthly);
      setTotals(analRes.totals);
    }).finally(() => setLoading(false));
  }, []);

  const balance = totals.total_income - totals.total_expense;
  const recent = transactions.slice(0, 6);
  const maxBar = Math.max(...monthly.map(m => m.income), 1);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-muted-foreground text-sm">
          <Icon name="Loader2" size={16} className="animate-spin" />
          Загрузка данных...
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Финансовый обзор</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Актуально на сегодня</p>
        </div>
        <button className="fin-btn-secondary flex items-center gap-2">
          <Icon name="Download" size={14} />
          Экспорт
        </button>
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
          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
            <Icon name="BarChart2" size={11} />
            {totals.total_transactions} транзакций всего
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="section-title">Доходы</span>
            <div className="w-7 h-7 rounded bg-emerald-500/10 flex items-center justify-center">
              <Icon name="ArrowDownLeft" size={13} className="text-emerald-400" />
            </div>
          </div>
          <div className="font-mono-ibm text-2xl font-semibold text-income">{formatCurrency(totals.total_income)}</div>
          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
            <Icon name="TrendingUp" size={11} />
            {transactions.filter(t => t.type === 'income').length} поступлений
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="section-title">Расходы</span>
            <div className="w-7 h-7 rounded bg-red-500/10 flex items-center justify-center">
              <Icon name="ArrowUpRight" size={13} className="text-red-400" />
            </div>
          </div>
          <div className="font-mono-ibm text-2xl font-semibold text-expense">{formatCurrency(totals.total_expense)}</div>
          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
            <Icon name="TrendingDown" size={11} />
            {transactions.filter(t => t.type === 'expense').length} расходов
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Chart */}
        <div className="col-span-2 stat-card">
          <div className="flex items-center justify-between mb-5">
            <span className="text-sm font-medium text-foreground">Динамика по месяцам</span>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />Доходы</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" />Расходы</span>
            </div>
          </div>
          {monthly.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-xs text-muted-foreground">Нет данных</div>
          ) : (
            <div className="flex items-end gap-2 h-40">
              {monthly.map((m) => (
                <div key={m.month_key} className="flex-1 flex flex-col items-center gap-1">
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
          )}
        </div>

        {/* Reminders */}
        <div className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-foreground">Напоминания</span>
            <span className="text-[10px] bg-primary/15 text-primary px-1.5 py-0.5 rounded font-medium">{reminders.length}</span>
          </div>
          <div className="space-y-2">
            {reminders.length === 0 && <div className="text-xs text-muted-foreground">Нет напоминаний</div>}
            {reminders.map((r) => (
              <div key={r.id} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${r.status === 'overdue' ? 'bg-red-400' : 'bg-amber-400'}`} />
                  <div>
                    <div className="text-xs font-medium text-foreground">{r.title}</div>
                    <div className="text-[10px] text-muted-foreground">{formatDate(r.due_date)}</div>
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
        </div>
        <div className="space-y-0.5">
          {recent.length === 0 && <div className="text-xs text-muted-foreground py-4 text-center">Транзакций пока нет</div>}
          {recent.map((t) => (
            <div key={t.id} className="data-row">
              <div className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded flex items-center justify-center ${t.type === 'income' ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                  <Icon name={t.type === 'income' ? 'ArrowDownLeft' : 'ArrowUpRight'} size={12} className={t.type === 'income' ? 'text-emerald-400' : 'text-red-400'} />
                </div>
                <div>
                  <div className="text-sm text-foreground">{t.description}</div>
                  <div className="text-[11px] text-muted-foreground">{t.category_name ?? '—'} · {formatDate(t.date)}</div>
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
