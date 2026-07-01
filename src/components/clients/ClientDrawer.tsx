import { useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';
import { api, Client } from '@/lib/api';
import { formatCurrency, formatDate } from '@/data/mockData';

interface Props {
  client: Client;
  onClose: () => void;
  onEdit: (c: Client) => void;
}

export default function ClientDrawer({ client, onClose, onEdit }: Props) {
  const [detail, setDetail] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [quickInput, setQuickInput] = useState('');
  const [quickSaving, setQuickSaving] = useState(false);
  const [quickError, setQuickError] = useState('');
  const [quickSuccess, setQuickSuccess] = useState('');

  useEffect(() => {
    api.clients.get(client.id).then(setDetail).finally(() => setLoading(false));
  }, [client.id]);

  const income = detail?.stats?.total_income ?? 0;
  const expense = detail?.stats?.total_expense ?? 0;
  const fullName = [client.last_name, client.first_name, client.middle_name].filter(Boolean).join(' ');

  function parseQuick(raw: string): { type: 'income' | 'expense'; amount: number; description: string } | null {
    const m = raw.trim().match(/^([+\-−])?\s*(\d[\d\s]*)\s+(.+)$/);
    if (!m) return null;
    const amount = parseFloat(m[2].replace(/\s/g, ''));
    if (!amount || amount <= 0) return null;
    const type: 'income' | 'expense' = m[1] === '+' ? 'income' : 'expense';
    return { type, amount, description: m[3].trim() };
  }

  async function handleQuickAdd() {
    setQuickError('');
    setQuickSuccess('');
    const parsed = parseQuick(quickInput);
    if (!parsed) {
      setQuickError('Формат: −10000 хлеб  или  +50000 оплата');
      return;
    }
    setQuickSaving(true);
    try {
      const created = await api.transactions.create({
        type: parsed.type,
        amount: parsed.amount,
        description: parsed.description,
        date: new Date().toISOString().split('T')[0],
        client_id: client.id,
      });
      const sign = parsed.type === 'income' ? '+' : '−';
      setQuickSuccess(`${sign}${parsed.amount.toLocaleString('ru-RU')} ₽ — записано`);
      setQuickInput('');
      setDetail(prev => prev ? {
        ...prev,
        transactions: [{ id: created.id, type: parsed.type, amount: parsed.amount, description: parsed.description, date: created.date, category_name: null, category_color: null }, ...(prev.transactions ?? [])],
        stats: {
          total_income: (prev.stats?.total_income ?? 0) + (parsed.type === 'income' ? parsed.amount : 0),
          total_expense: (prev.stats?.total_expense ?? 0) + (parsed.type === 'expense' ? parsed.amount : 0),
        }
      } : prev);
      setTimeout(() => setQuickSuccess(''), 3000);
    } finally {
      setQuickSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div
        className="w-[480px] h-full bg-card border-l border-border flex flex-col shadow-2xl animate-slide-in-right"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-border flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
              {client.last_name[0]}{client.first_name[0]}
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">{fullName}</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Клиент с {formatDate(client.opened_at)}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(client)}
              className="fin-btn-secondary text-xs flex items-center gap-1.5 h-7 px-2.5"
            >
              <Icon name="Pencil" size={12} />
              Изменить
            </button>
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded hover:bg-secondary text-muted-foreground">
              <Icon name="X" size={15} />
            </button>
          </div>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-3 gap-3 px-6 py-4 border-b border-border">
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Стоимость/мес</div>
            <div className="text-base font-mono-ibm font-semibold text-income">{formatCurrency(client.monthly_cost)}</div>
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Доходы</div>
            <div className="text-base font-mono-ibm font-semibold text-income">{formatCurrency(income)}</div>
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Расходы</div>
            <div className="text-base font-mono-ibm font-semibold text-expense">{formatCurrency(expense)}</div>
          </div>
        </div>

        {/* Quick add */}
        <div className="px-6 py-3 border-b border-border">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="−10000 аренда  или  +50000 оплата"
                className="fin-input pr-8 font-mono-ibm text-xs w-full"
                value={quickInput}
                onChange={e => { setQuickInput(e.target.value); setQuickError(''); setQuickSuccess(''); }}
                onKeyDown={e => e.key === 'Enter' && handleQuickAdd()}
              />
              {quickInput && (
                <span className={`absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-medium ${quickInput.trim().startsWith('+') ? 'text-income' : 'text-expense'}`}>
                  {quickInput.trim().startsWith('+') ? 'доход' : 'расход'}
                </span>
              )}
            </div>
            <button
              onClick={handleQuickAdd}
              disabled={quickSaving || !quickInput.trim()}
              className="fin-btn-primary h-8 px-3 flex items-center gap-1.5 text-xs"
            >
              {quickSaving ? <Icon name="Loader2" size={12} className="animate-spin" /> : <Icon name="Plus" size={12} />}
            </button>
          </div>
          {quickError && <div className="text-[11px] text-red-400 mt-1.5">{quickError}</div>}
          {quickSuccess && <div className="text-[11px] text-income mt-1.5 flex items-center gap-1"><Icon name="CheckCircle" size={11} />{quickSuccess}</div>}
        </div>

        {/* Transactions */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            Транзакции клиента
          </div>
          {loading && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground py-8 justify-center">
              <Icon name="Loader2" size={14} className="animate-spin" /> Загрузка...
            </div>
          )}
          {!loading && (!detail?.transactions || detail.transactions.length === 0) && (
            <div className="text-xs text-muted-foreground py-8 text-center">
              Транзакций по этому клиенту ещё нет.
              <br />Добавьте доход или расход и выберите клиента.
            </div>
          )}
          {!loading && detail?.transactions?.map(t => (
            <div key={t.id} className="flex items-center justify-between py-2.5 border-b border-border/40 last:border-0">
              <div className="flex items-center gap-2.5">
                <div className={`w-6 h-6 rounded flex items-center justify-center ${t.type === 'income' ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                  <Icon
                    name={t.type === 'income' ? 'ArrowDownLeft' : 'ArrowUpRight'}
                    size={11}
                    className={t.type === 'income' ? 'text-emerald-400' : 'text-red-400'}
                  />
                </div>
                <div>
                  <div className="text-xs text-foreground">{t.description}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {t.category_name ?? '—'} · {formatDate(t.date)}
                  </div>
                </div>
              </div>
              <div className={`font-mono-ibm text-xs font-medium ${t.type === 'income' ? 'text-income' : 'text-expense'}`}>
                {t.type === 'income' ? '+' : '−'}{formatCurrency(t.amount)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
