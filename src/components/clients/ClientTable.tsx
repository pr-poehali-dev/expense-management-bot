import Icon from '@/components/ui/icon';
import { Client } from '@/lib/api';
import { formatCurrency, formatDate } from '@/data/mockData';

interface Props {
  clients: Client[];
  loading: boolean;
  search: string;
  searchInput: string;
  totalMonthly: number;
  onSearchChange: (val: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  onClearSearch: () => void;
  onRowClick: (c: Client) => void;
  onEdit: (c: Client) => void;
}

function fullName(c: Client) {
  return [c.last_name, c.first_name, c.middle_name].filter(Boolean).join(' ');
}

function initials(c: Client) {
  return [c.last_name[0], c.first_name[0]].filter(Boolean).join('').toUpperCase();
}

export default function ClientTable({
  clients, loading, search, searchInput, totalMonthly,
  onSearchChange, onSearchSubmit, onClearSearch, onRowClick, onEdit,
}: Props) {
  return (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-foreground">Список клиентов</span>
        <form onSubmit={onSearchSubmit} className="flex items-center gap-2">
          <div className="relative">
            <Icon name="Search" size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Поиск по ФИО..."
              className="fin-input pl-8 w-52 h-8 text-xs"
              value={searchInput}
              onChange={e => onSearchChange(e.target.value)}
            />
          </div>
          {search && (
            <button type="button" onClick={onClearSearch} className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
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
                <tr
                  key={c.id}
                  className="border-b border-border/40 hover:bg-secondary/30 transition-colors group cursor-pointer"
                  onClick={() => onRowClick(c)}
                >
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
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {c.tx_count !== undefined && c.tx_count > 0 && (
                        <span className="text-[10px] text-muted-foreground font-mono-ibm mr-1">{c.tx_count} тр.</span>
                      )}
                      <button
                        onClick={e => { e.stopPropagation(); onEdit(c); }}
                        className="w-6 h-6 flex items-center justify-center rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Icon name="Pencil" size={12} />
                      </button>
                      <Icon name="ChevronRight" size={13} className="text-muted-foreground" />
                    </div>
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
  );
}
