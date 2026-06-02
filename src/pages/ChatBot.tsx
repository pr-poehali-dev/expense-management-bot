import { useState, useRef, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { transactions, categories, formatCurrency } from '@/data/mockData';

interface Message {
  id: number;
  role: 'bot' | 'user';
  text: string;
  time: string;
}

const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

function getTime() {
  return new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

function detectCategory(text: string): string | null {
  const lower = text.toLowerCase();
  const allCats = [...categories.income, ...categories.expense];
  for (const cat of allCats) {
    if (lower.includes(cat.name.toLowerCase())) return cat.name;
  }
  if (lower.includes('еда') || lower.includes('продукт') || lower.includes('обед')) return 'Питание';
  if (lower.includes('такси') || lower.includes('бензин') || lower.includes('метро')) return 'Транспорт';
  if (lower.includes('зарплат') || lower.includes('аванс')) return 'Зарплата';
  if (lower.includes('аренда')) return lower.includes('получ') ? 'Аренда (доход)' : 'Жильё и ЖКХ';
  return null;
}

function generateResponse(text: string): string {
  const lower = text.toLowerCase();

  if (lower.includes('баланс') || lower.includes('сколько') || lower.includes('остаток')) {
    return `Текущий баланс за период: **${formatCurrency(totalIncome - totalExpense)}**\n\nДоходы: ${formatCurrency(totalIncome)}\nРасходы: ${formatCurrency(totalExpense)}\n\nНорма сбережений составляет ${Math.round(((totalIncome - totalExpense) / totalIncome) * 100)}% — отличный результат!`;
  }

  if (lower.includes('расход') && (lower.includes('много') || lower.includes('сократ') || lower.includes('снизить'))) {
    const top = [...categories.expense]
      .map(cat => ({ ...cat, total: transactions.filter(t => t.type === 'expense' && t.category === cat.id).reduce((s, t) => s + t.amount, 0) }))
      .sort((a, b) => b.total - a.total)[0];
    return `Наибольшая статья расходов — **${top.name}** (${formatCurrency(top.total)}). Рекомендую:\n\n• Установить лимит на эту категорию\n• Сравнить с прошлым месяцем\n• Настроить напоминание о превышении бюджета`;
  }

  if (lower.includes('напомн') || lower.includes('платёж') || lower.includes('оплат')) {
    return `Создам напоминание. Укажите:\n\n1. Название платежа\n2. Сумму\n3. Дату\n\nНапример: *«Напомни об оплате интернета 15 числа на 650 рублей»*`;
  }

  if (lower.includes('добав') || lower.includes('трат') || lower.includes('купил') || lower.includes('заплатил')) {
    const cat = detectCategory(text);
    const amountMatch = text.match(/\d[\d\s]*/);
    const amount = amountMatch ? amountMatch[0].replace(/\s/g, '') : null;
    if (cat && amount) {
      return `Распознана транзакция:\n\n📁 Категория: **${cat}**\n💰 Сумма: **${formatCurrency(Number(amount))}**\n📅 Дата: сегодня\n\nЗаписать эту транзакцию?`;
    }
    if (cat) {
      return `Определил категорию: **${cat}**. Уточните сумму транзакции для записи.`;
    }
    return `Укажите подробности транзакции:\n\n• Сумму (например, *«5000 рублей»*)\n• Категорию или описание\n• Дату (если не сегодня)\n\nЯ автоматически определю категорию и запишу в систему.`;
  }

  if (lower.includes('аналитик') || lower.includes('отчёт') || lower.includes('статистик')) {
    const savings = Math.round(((totalIncome - totalExpense) / totalIncome) * 100);
    return `Финансовая сводка за период:\n\n📈 Доходы: ${formatCurrency(totalIncome)}\n📉 Расходы: ${formatCurrency(totalExpense)}\n💼 Сбережения: ${savings}%\n\nПо сравнению с прошлым месяцем доходы выросли на 12%. Расходы в норме. Рекомендую увеличить инвестиционную долю.`;
  }

  if (lower.includes('привет') || lower.includes('здравствуй') || lower.includes('добрый')) {
    return `Здравствуйте! Я ваш финансовый ассистент.\n\nМогу помочь:\n• Записать доходы и расходы\n• Проанализировать финансы\n• Распределить транзакции по категориям\n• Создать напоминания о платежах\n\nЧто вас интересует?`;
  }

  const cat = detectCategory(text);
  if (cat) {
    return `Определил категорию: **${cat}**.\n\nЕсли хотите добавить транзакцию, укажите сумму и я её запишу автоматически.`;
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

const initMessages: Message[] = [
  {
    id: 1,
    role: 'bot',
    text: 'Добро пожаловать! Я финансовый ассистент ФинансПро.\n\nМогу автоматически распределять транзакции по категориям, создавать напоминания о платежах и анализировать ваши финансы.\n\nКак я могу помочь?',
    time: getTime(),
  }
];

const suggestions = [
  'Покажи баланс',
  'Добавить расход 5000 на еду',
  'Создай напоминание об оплате',
  'Финансовый отчёт',
];

export default function ChatBot() {
  const [messages, setMessages] = useState<Message[]>(initMessages);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

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
      const resp = generateResponse(text);
      const botMsg: Message = { id: Date.now() + 1, role: 'bot', text: resp, time: getTime() };
      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
    }, 900 + Math.random() * 600);
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  return (
    <div className="p-6 h-full flex flex-col animate-fade-in" style={{ height: 'calc(100vh - 0px)' }}>
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

      <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-0" style={{ maxHeight: 'calc(100vh - 280px)' }}>
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

      {/* Suggestions */}
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

      {/* Input */}
      <div className="flex gap-2 mt-1">
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
