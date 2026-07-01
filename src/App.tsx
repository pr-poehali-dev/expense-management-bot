import { useState } from 'react';
import { Toaster } from "@/components/ui/toaster";
import Sidebar from '@/components/Sidebar';
import Dashboard from '@/pages/Dashboard';
import Income from '@/pages/Income';
import Expenses from '@/pages/Expenses';
import Categories from '@/pages/Categories';
import Analytics from '@/pages/Analytics';
import ChatBot from '@/pages/ChatBot';
import Settings from '@/pages/Settings';
import Clients from '@/pages/Clients';
import BotAccess from '@/pages/BotAccess';
import Login from '@/pages/Login';
import Icon from '@/components/ui/icon';

type Page = 'dashboard' | 'income' | 'expenses' | 'categories' | 'analytics' | 'clients' | 'chat' | 'botaccess' | 'settings';

const pageTitles: Record<Page, string> = {
  dashboard: 'Обзор',
  income: 'Доходы',
  expenses: 'Расходы',
  categories: 'Категории',
  analytics: 'Аналитика',
  clients: 'Клиенты',
  chat: 'Финансовый ассистент',
  botaccess: 'Доступ к боту',
  settings: 'Настройки',
};

export default function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('auth_token'));
  const [activePage, setActivePage] = useState<Page>('dashboard');

  function handleLogin(t: string) {
    setToken(t);
  }

  function handleLogout() {
    localStorage.removeItem('auth_token');
    setToken(null);
  }

  if (!token) {
    return <Login onLogin={handleLogin} />;
  }

  function renderPage() {
    switch (activePage) {
      case 'dashboard': return <Dashboard />;
      case 'income': return <Income />;
      case 'expenses': return <Expenses />;
      case 'categories': return <Categories />;
      case 'analytics': return <Analytics />;
      case 'clients': return <Clients />;
      case 'chat': return <ChatBot />;
      case 'botaccess': return <BotAccess />;
      case 'settings': return <Settings />;
      default: return <Dashboard />;
    }
  }

  return (
    <div className="flex min-h-screen bg-background font-ibm">
      <Toaster />
      <Sidebar activePage={activePage} onNavigate={setActivePage} />

      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="h-12 border-b border-border flex items-center justify-between px-6 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="text-xs text-muted-foreground">
            <span className="text-foreground font-medium">{pageTitles[activePage]}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs text-muted-foreground font-mono-ibm">
              {new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
            <div className="w-px h-4 bg-border" />
            <button
              onClick={handleLogout}
              title="Выйти"
              className="w-7 h-7 flex items-center justify-center rounded hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
            >
              <Icon name="LogOut" size={14} />
            </button>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
