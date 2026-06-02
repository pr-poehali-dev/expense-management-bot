import Icon from '@/components/ui/icon';

type Page = 'dashboard' | 'income' | 'expenses' | 'categories' | 'analytics' | 'chat' | 'settings';

interface SidebarProps {
  activePage: Page;
  onNavigate: (page: Page) => void;
}

const navItems = [
  { id: 'dashboard' as Page, label: 'Обзор', icon: 'LayoutDashboard' },
  { id: 'income' as Page, label: 'Доходы', icon: 'TrendingUp' },
  { id: 'expenses' as Page, label: 'Расходы', icon: 'TrendingDown' },
  { id: 'categories' as Page, label: 'Категории', icon: 'Tag' },
  { id: 'analytics' as Page, label: 'Аналитика', icon: 'BarChart3' },
  { id: 'chat' as Page, label: 'Ассистент', icon: 'MessageSquare' },
];

const bottomItems = [
  { id: 'settings' as Page, label: 'Настройки', icon: 'Settings' },
];

export default function Sidebar({ activePage, onNavigate }: SidebarProps) {
  return (
    <aside className="w-56 min-h-screen bg-[hsl(var(--sidebar-background))] border-r border-border flex flex-col">
      <div className="px-4 py-5 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-primary rounded flex items-center justify-center">
            <Icon name="BarChart2" size={14} className="text-primary-foreground" />
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground tracking-tight">ФинансПро</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest">Управление</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <div className="section-title px-3 mb-3">Главное меню</div>
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`nav-item w-full text-left ${activePage === item.id ? 'active' : ''}`}
          >
            <Icon name={item.icon} size={15} />
            <span>{item.label}</span>
            {item.id === 'chat' && (
              <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            )}
          </button>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-border space-y-0.5">
        {bottomItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`nav-item w-full text-left ${activePage === item.id ? 'active' : ''}`}
          >
            <Icon name={item.icon} size={15} />
            <span>{item.label}</span>
          </button>
        ))}
        <div className="mt-3 mx-3 pt-3 border-t border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-xs font-semibold text-foreground">
              АИ
            </div>
            <div>
              <div className="text-xs font-medium text-foreground">Иванов А.И.</div>
              <div className="text-[10px] text-muted-foreground">Администратор</div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
