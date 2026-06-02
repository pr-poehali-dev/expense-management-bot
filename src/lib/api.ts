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
    create: (data: { type: string; amount: number; category_id?: number | null; description: string; date: string }) =>
      request<Transaction>("POST", {}, { resource: "transaction", ...data }),
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
};
