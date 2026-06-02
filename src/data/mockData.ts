export const categories = {
  income: [
    { id: 'salary', name: 'Зарплата', color: '#22c55e', icon: 'Briefcase' },
    { id: 'freelance', name: 'Фриланс', color: '#3b82f6', icon: 'Laptop' },
    { id: 'investments', name: 'Инвестиции', color: '#a855f7', icon: 'TrendingUp' },
    { id: 'rental', name: 'Аренда', color: '#f59e0b', icon: 'Home' },
    { id: 'other_income', name: 'Прочее', color: '#6b7280', icon: 'Plus' },
  ],
  expense: [
    { id: 'housing', name: 'Жильё и ЖКХ', color: '#ef4444', icon: 'Building' },
    { id: 'food', name: 'Питание', color: '#f97316', icon: 'UtensilsCrossed' },
    { id: 'transport', name: 'Транспорт', color: '#eab308', icon: 'Car' },
    { id: 'health', name: 'Здоровье', color: '#ec4899', icon: 'Heart' },
    { id: 'education', name: 'Образование', color: '#8b5cf6', icon: 'BookOpen' },
    { id: 'entertainment', name: 'Развлечения', color: '#06b6d4', icon: 'Gamepad2' },
    { id: 'clothing', name: 'Одежда', color: '#14b8a6', icon: 'ShoppingBag' },
    { id: 'other_expense', name: 'Прочее', color: '#6b7280', icon: 'MoreHorizontal' },
  ]
};

export const transactions = [
  { id: 1, type: 'income', amount: 185000, category: 'salary', description: 'Зарплата за ноябрь', date: '2026-05-30', tags: [] },
  { id: 2, type: 'expense', amount: 42000, category: 'housing', description: 'Аренда квартиры', date: '2026-05-30', tags: [] },
  { id: 3, type: 'income', amount: 35000, category: 'freelance', description: 'Разработка сайта', date: '2026-05-28', tags: [] },
  { id: 4, type: 'expense', amount: 12500, category: 'food', description: 'Продукты на неделю', date: '2026-05-27', tags: [] },
  { id: 5, type: 'expense', amount: 8900, category: 'transport', description: 'Бензин и парковка', date: '2026-05-26', tags: [] },
  { id: 6, type: 'income', amount: 15000, category: 'investments', description: 'Дивиденды по акциям', date: '2026-05-25', tags: [] },
  { id: 7, type: 'expense', amount: 5200, category: 'health', description: 'Медикаменты', date: '2026-05-24', tags: [] },
  { id: 8, type: 'expense', amount: 3800, category: 'entertainment', description: 'Кино и рестораны', date: '2026-05-23', tags: [] },
  { id: 9, type: 'expense', amount: 18500, category: 'clothing', description: 'Деловой костюм', date: '2026-05-22', tags: [] },
  { id: 10, type: 'income', amount: 25000, category: 'rental', description: 'Аренда гаража', date: '2026-05-20', tags: [] },
  { id: 11, type: 'expense', amount: 9700, category: 'education', description: 'Онлайн-курсы', date: '2026-05-18', tags: [] },
  { id: 12, type: 'expense', amount: 6400, category: 'food', description: 'Кафе и доставка', date: '2026-05-17', tags: [] },
  { id: 13, type: 'income', amount: 42000, category: 'freelance', description: 'Консультация по проекту', date: '2026-05-15', tags: [] },
  { id: 14, type: 'expense', amount: 4100, category: 'transport', description: 'Такси', date: '2026-05-14', tags: [] },
  { id: 15, type: 'expense', amount: 7800, category: 'other_expense', description: 'Бытовая химия и прочее', date: '2026-05-12', tags: [] },
];

export const monthlyData = [
  { month: 'Дек', income: 195000, expense: 98000 },
  { month: 'Янв', income: 210000, expense: 112000 },
  { month: 'Фев', income: 198000, expense: 105000 },
  { month: 'Мар', income: 225000, expense: 118000 },
  { month: 'Апр', income: 242000, expense: 124000 },
  { month: 'Май', income: 302000, expense: 118900 },
];

export const reminders = [
  { id: 1, title: 'Оплата аренды', amount: 42000, dueDate: '2026-06-01', category: 'housing', status: 'upcoming' },
  { id: 2, title: 'Налог на доходы', amount: 24050, dueDate: '2026-06-15', category: 'other_expense', status: 'upcoming' },
  { id: 3, title: 'Страховка автомобиля', amount: 18500, dueDate: '2026-06-20', category: 'transport', status: 'upcoming' },
  { id: 4, title: 'Подписка на сервисы', amount: 3200, dueDate: '2026-05-31', category: 'other_expense', status: 'overdue' },
];

export const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(amount);

export const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
