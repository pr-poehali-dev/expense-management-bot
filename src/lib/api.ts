const BASE_URL = "https://functions.poehali.dev/ad6ffcbf-785e-461d-b60c-e4f93a487a40";

async function request<T>(method: string, params: Record<string, string> = {}, body?: object): Promise<T> {
  const url = new URL(BASE_URL);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const data = JSON.parse(text);
  if (typeof data === "string") return JSON.parse(data) as T;
  return data as T;
}

export interface Transaction {
  id: number;
  type: "income" | "expense";
  amount: number;
  description: string;
  date: string;
  created_at: string;
  category_id: number | null;
  category_name: string | null;
  category_color: string | null;
  category_icon: string | null;
  client_id: number | null;
  client_last_name: string | null;
  client_first_name: string | null;
  client_middle_name: string | null;
}

export interface Category {
  id: number;
  name: string;
  type: "income" | "expense";
  color: string;
  icon: string;
}

export interface Reminder {
  id: number;
  title: string;
  amount: number;
  due_date: string;
  status: "upcoming" | "overdue" | "done";
  category_name: string | null;
  category_color: string | null;
}

export interface Client {
  id: number;
  last_name: string;
  first_name: string;
  middle_name: string;
  monthly_cost: number;
  opened_at: string;
  created_at: string;
  payment_day: number | null;
  tx_count?: number;
  total_income?: number;
  total_expense?: number;
  transactions?: {
    id: number; type: string; amount: number; description: string;
    date: string; category_name: string | null; category_color: string | null;
  }[];
  stats?: { total_income: number; total_expense: number };
}

export interface AnalyticsData {
  monthly: { month: string; month_key: string; income: number; expense: number }[];
  by_category: { id: number; name: string; color: string; icon: string; type: string; total: number; tx_count: number }[];
  totals: { total_income: number; total_expense: number; total_transactions: number };
}

export const api = {
  transactions: {
    list: (type?: "income" | "expense") =>
      request<{ transactions: Transaction[]; total: number }>("GET", {
        resource: "transactions",
        ...(type ? { type } : {}),
      }),
    create: (data: { type: string; amount: number; category_id?: number | null; client_id?: number | null; description: string; date: string }) =>
      request<Transaction>("POST", {}, { resource: "transaction", ...data }),
    listByClient: (client_id: number) =>
      request<{ transactions: Transaction[]; total: number }>("GET", { resource: "transactions", client_id: String(client_id) }),
    delete: (id: number) =>
      request<{ ok: boolean }>("DELETE", { resource: "transactions", id: String(id) }),
  },
  categories: {
    list: (type?: "income" | "expense") =>
      request<{ categories: Category[] }>("GET", {
        resource: "categories",
        ...(type ? { type } : {}),
      }),
    create: (data: { name: string; type: string; color: string; icon: string }) =>
      request<Category>("POST", {}, { resource: "category", ...data }),
  },
  analytics: {
    get: () => request<AnalyticsData>("GET", { resource: "analytics" }),
  },
  reminders: {
    list: () => request<{ reminders: Reminder[] }>("GET", { resource: "reminders" }),
    create: (data: { title: string; amount: number; due_date: string; category_id?: number | null }) =>
      request<Reminder>("POST", {}, { resource: "reminder", ...data }),
    updateStatus: (id: number, status: string) =>
      request<{ ok: boolean }>("PUT", { resource: "reminders", id: String(id) }, { status }),
  },
  clients: {
    list: (search?: string) =>
      request<{ clients: Client[]; total: number; total_monthly: number }>("GET", {
        resource: "clients",
        ...(search ? { search } : {}),
      }),
    get: (id: number) =>
      request<Client>("GET", { resource: "clients", id: String(id) }),
    create: (data: { last_name: string; first_name: string; middle_name: string; monthly_cost: number; opened_at: string; payment_day?: number | null }) =>
      request<Client>("POST", {}, { resource: "clients", ...data }),
    update: (id: number, data: { last_name: string; first_name: string; middle_name: string; monthly_cost: number; opened_at: string; payment_day?: number | null }) =>
      request<Client>("PUT", { resource: "clients", id: String(id) }, data),
  },
  whitelist: {
    list: () =>
      request<{ whitelist: { id: number; phone: string; name: string; user_id: number | null; is_active: boolean; created_at: string }[]; total: number }>("GET", { resource: "whitelist" }),
    create: (data: { phone: string; name: string }) =>
      request<{ id: number; phone: string; name: string; user_id: number | null; is_active: boolean; created_at: string }>("POST", {}, { resource: "whitelist", ...data }),
    update: (id: number, data: { is_active?: boolean; name?: string; phone?: string }) =>
      request<{ id: number; phone: string; name: string; user_id: number | null; is_active: boolean; created_at: string }>("PUT", { resource: "whitelist", id: String(id) }, data),
  },
};