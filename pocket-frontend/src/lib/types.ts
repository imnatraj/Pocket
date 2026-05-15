export type Currency = "INR" | "USD" | "EUR" | "GBP";

export interface Category {
  id: string;
  name: string;
  icon: string; // lucide icon name
  color: string; // hsl token
  type: "income" | "expense";
  isCustom?: boolean;
}

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: "income" | "expense";
  categoryId: string;
  date: string; // ISO (UTC)
  note?: string;
  receipt?: string; // base64
  createdAt: string;
}

export interface Budget {
  categoryId: string;
  limit: number;
}

export interface AppSettings {
  currency: Currency;
  theme: "light" | "dark";
}
