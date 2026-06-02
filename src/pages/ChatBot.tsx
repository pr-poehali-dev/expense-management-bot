import { useState, useRef, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { api, Transaction, Category } from '@/lib/api';
import { formatCurrency } from '@/data/mockData';

interface Message {
  id: number;
  role: 'bot' | 'user';
  text: string;
  time: string;
}

function getTime() {
  return new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

function detectCategory(text: string, cats: Category[]): Category | null {
  const lower = text.toLowerCase();
  for (const cat of cats) {
    if (lower.includes(cat.name.toLowerCase())) return cat;
  }
  const keywordMap: Record<string, string[]> = {
    'Питание': ['еда', 'продукт', 'обед', 'ужин', 'завтрак', 'кафе', 'ресторан'],
    'Транспорт': ['такси', 'бензин', 'метро', 'автобус', 'парковка'],
    'Зарплата': ['зарплат', 'аванс', 'оклад'],
    'Жильё и ЖКХ': ['аренда', 'квартира', 'коммунал', 'жкх'],
    'Здоровье': ['аптека', 'лекарств', 'врач', 'медицин'],
    'Развлечения': ['кино', 'театр', 'концерт', 'игр'],
  };
  for (const [name, keywords] of Object.entries(keywordMap)) {
    if (keywords.some(k => lower.includes(k))) {
      return cats.find(c => c.name === name) ?? null;
    }
  }
  return null;
}

function generateResponse(
  text: string,
  cats: Category[],
  transactions: Transaction[],
  totals: { total_income: number; total_expense: number }
): string {
  const lower = text.toLowerCase();
  const { total_income, total_expense } = totals;
  const balance = total_income - total_expense;
  const savingsRate = total_income > 0 ? Math.round((balance / total_income) * 100) : 0;

  if (lower.includes('баланс') || lower.includes('сколько') || lower.includes('остаток')) {
    return `Текущий баланс: **${formatCurrency(balance)}**\n\nДоходы: ${formatCurrency(total_income)}\nРасходы: ${formatCurrency(total_expense)}\n\nНорма сбережений: ${savingsRate}%`;
  }

  if (lower.includes('расход') && (lower.includes('много') || lower.includes('сократ') || lower.includes('снизить'))) {
    const expCats = cats.filter(c => c.type === 'expense');
    const top = expCats.map(cat => ({
      ...cat,
      total: transactions.filter(t => t.category_id === cat.id).reduce((s, t) => s + t.amount, 0),
    })).sort((a, b) => b.total - a.total)[0];
    if (top && top.total > 0) {
      return `Наибольшая статья расходов — **${top.name}** (${formatCurrency(top.total)}). Рекомендую:\n\n• Установить лимит на эту категорию\n• Сравнить с прошлым месяцем\n• Настроить напоминание о превышении бюджета`;
    }
    return `Расходы под контролем. Всего потрачено: **${formatCurrency(total_expense)}**`;
  }

  if (lower.includes('напомн') || lower.includes('платёж') || lower.includes('оплат')) {
    return `Создам напоминание. Укажите:\n\n1. Название платежа\n2. Сумму\n3. Дату\n\nНапример: *«Напомни об оплате интернета 15 числа на 650 рублей»*`;
  }

  if (lower.includes('добав') || lower.includes('трат') || lower.includes('купил') || lower.includes('заплатил') || lower.includes('получил')) {
    const cat = detectCategory(text, cats);
    const amountMatch = text.match(/(\d[\d\s]*)/);
    const amount = amountMatch ? amountMatch[0].replace(/\s/g, '') : null;
    if (cat && amount) {
      return `Распознана транзакция:\n\n📁 Категория: **${cat.name}**\n💰 Сумма: **${formatCurrency(Number(amount))}**\n📅 Дата: сегодня\n\nПерейдите в раздел «${cat.type === 'income' ? 'Доходы' : 'Расходы'}» и добавьте запись вручную.`;
    }
    if (cat) {
      return `Определил категорию: **${cat.name}**. Уточните сумму для добавления транзакции.`;
    }
    return `Укажите подробности транзакции:\n\n• Сумму (*«5000 рублей»*)\n• Описание (*«обед в кафе»*)\n• Дату (если не сегодня)\n\nЯ определю категорию автоматически.`;
  }

  if (lower.includes('аналитик') || lower.includes('отчёт') || lower.includes('статистик')) {
    return `Финансовая сводка:\n\n📈 Доходы: ${formatCurrency(total_income)}\n📉 Расходы: ${formatCurrency(total_expense)}\n💼 Баланс: ${formatCurrency(balance)}\n📊 Норма сбережений: ${savingsRate}%\n\nПодробная аналитика — в разделе «Аналитика».`;
  }

  if (lower.includes('привет') || lower.includes('здравствуй') || lower.includes('добрый')) {
    return `Здравствуйте! Я ваш финансовый ассистент.\n\nМогу помочь:\n• Проанализировать финансы\n• Распределить транзакции по категориям\n• Создать напоминания о платежах\n\nВаш текущий баланс: **${formatCurrency(balance)}**`;
  }

  const cat = detectCategory(text, cats);
  if (cat) {
    const catTotal = transactions.filter(t => t.category_id === cat.id).reduce((s, t) => s + t.amount, 0);
    return `Категория **${cat.name}**: всего ${formatCurrency(catTotal)}.\n\nЕсли хотите добавить транзакцию, перейдите в раздел «${cat.type === 'income' ? 'Доходы' : 'Расходы'}».`;
  }

  return `Понял вас. Могу помочь с:\n\n• Анализом баланса — напишите *«баланс»*\n• Добавлением транзакции — *«потратил 3000 на еду»*\n• Напоминаниями — *«напомни об оплате»*\n• Финансовым отчётом — *«аналитика»*`;
}

function formatMsg(text: string) {
  return text.split('\n').map((line, i) => {
    const parts = line.split(/\*\*(.*?)\*\*/g);
    return (
      <span key={i}>
        {parts.map((p, j) => j % 2 === 1 ? <strong key={j} className="text-primary font-semibold">{p}</strong> : p)}
        {i < text.split('\n').length - 1 && <br />}
      </span>
    );
  });
}

const suggestions = [
  'Покажи баланс',
  'Добавить расход 5000 на еду',
  'Создай напоминание об оплате',
  'Финансовый отчёт',
];

export default function ChatBot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [cats, setCats] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totals, setTotals] = useState({ total_income: 0, total_expense: 0 });
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([api.categories.list(), api.transactions.list(), api.analytics.get()])
      .then(([catRes, txRes, analRes]) => {
        setCats(catRes.categories);
        setTransactions(txRes.transactions);
        setTotals(analRes.totals);
        const balance = analRes.totals.total_income - analRes.totals.total_expense;
        setMessages([{
          id: 1,
          role: 'bot',
          text: `Добро пожаловать! Я финансовый ассистент ФинансПро.\n\nВаш текущий баланс: **${formatCurrency(balance)}**\n\nМогу распределять транзакции по категориям, создавать напоминания и анализировать финансы. Как помочь?`,
          time: getTime(),
        }]);
      });
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  function sendMessage(text: string) {
    if (!text.trim()) return;
    const userMsg: Message = { id: Date.now(), role: 'user', text: text.trim(), time: getTime() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    setTimeout(() => {
      const respText = generateResponse(text, cats, transactions, totals);
      const botMsg: Message = { id: Date.now() + 1, role: 'bot', text: respText, time: getTime() };
      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
    }, 800 + Math.random() * 500);
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  return (
    <div className="p-6 flex flex-col animate-fade-in" style={{ height: 'calc(100vh - 48px)' }}>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Финансовый ассистент</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Автоматическая категоризация · Напоминания · Анализ</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          В сети
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-0">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-32">
            <Icon name="Loader2" size={16} className="animate-spin text-muted-foreground" />
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
            {msg.role === 'bot' && (
              <div className="w-7 h-7 rounded bg-primary/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Icon name="Bot" size={14} className="text-primary" />
              </div>
            )}
            <div className={msg.role === 'bot' ? 'chat-bubble-bot' : 'chat-bubble-user'}>
              <div className="leading-relaxed">{formatMsg(msg.text)}</div>
              <div className="text-[10px] text-muted-foreground mt-2">{msg.time}</div>
            </div>
            {msg.role === 'user' && (
              <div className="w-7 h-7 rounded bg-secondary flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-semibold text-foreground">
                АИ
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-3 justify-start animate-fade-in">
            <div className="w-7 h-7 rounded bg-primary/15 flex items-center justify-center flex-shrink-0">
              <Icon name="Bot" size={14} className="text-primary" />
            </div>
            <div className="chat-bubble-bot flex items-center gap-1 py-4 px-5">
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="flex gap-2 flex-wrap mt-4 mb-3">
        {suggestions.map(s => (
          <button
            key={s}
            onClick={() => sendMessage(s)}
            className="text-xs px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all"
          >
            {s}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Напишите сообщение... (Enter для отправки)"
          className="fin-input flex-1"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          disabled={isTyping}
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || isTyping}
          className="fin-btn-primary px-4 flex items-center gap-2 disabled:opacity-40"
        >
          <Icon name="Send" size={14} />
        </button>
      </div>
    </div>
  );
}
