import { createContext, useContext, useEffect, useMemo, useState, ReactNode, useCallback } from "react";
import type { AppSettings, Budget, Category, Currency, Transaction } from "@/lib/types";
import { DEFAULT_CATEGORIES } from "@/lib/seed";
import { api, isApiConfigured } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { toUTC } from "@/lib/date";
import Decimal from "decimal.js";

const LOCAL_KEY = "pocket.local.v4";
const DATA_KEY = "pocket.data.v2";

interface LocalState {
  categories: Category[];
  settings: AppSettings;
}
interface DataState {
  transactions: Transaction[];
  budgets: Budget[];
}

interface State extends LocalState, DataState {
  ready: boolean;
}

interface AppContextValue extends State {
  addTransaction: (tx: Omit<Transaction, "id" | "createdAt">) => Promise<Transaction>;
  updateTransaction: (id: string, patch: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addCategory: (cat: Omit<Category, "id" | "isCustom">) => Category;
  deleteCategory: (id: string) => void;
  setBudget: (categoryId: string, limit: number) => void;
  removeBudget: (categoryId: string) => void;
  setCurrency: (c: Currency) => void;
  toggleTheme: () => void;
  resetData: () => void;
  getCategory: (id: string) => Category | undefined;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

const loadLocal = (): LocalState => {
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(LOCAL_KEY);
      if (raw) return JSON.parse(raw) as LocalState;
    } catch {}
  }
  return { categories: DEFAULT_CATEGORIES, settings: { currency: "INR", theme: "dark" } };
};

const rowToTx = (r: any): Transaction => ({
  id: r.id,
  title: r.title,
  amount: new Decimal(r.amount).toNumber(),
  type: r.type,
  categoryId: r.categoryId ?? r.category_id,
  date: r.date,
  note: r.note ?? undefined,
  receipt: r.receipt ?? undefined,
  createdAt: r.createdAt ?? r.created_at,
});

export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [local, setLocal] = useState<LocalState>(loadLocal);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [ready, setReady] = useState(false);

  const useApi = isApiConfigured() && !!user;

  useEffect(() => {
    try { localStorage.setItem(LOCAL_KEY, JSON.stringify(local)); } catch {}
  }, [local]);

  useEffect(() => {
    const root = document.documentElement;
    if (local.settings.theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
  }, [local.settings.theme]);

  const refreshData = useCallback(async () => {
    if (!user || !useApi) return;
    try {
      const [txs, bds] = await Promise.all([
        api<any[]>("/transactions"),
        api<any[]>("/budgets"),
      ]);
      setTransactions(txs.map(rowToTx));
      setBudgets(bds.map((b) => ({ 
        categoryId: b.categoryId ?? b.category_id, 
        limit: new Decimal(b.limit).toNumber() 
      })));
    } catch (e) {
      console.error("Data refresh failed", e);
    }
  }, [user, useApi]);

  // Initial Load
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setReady(false);
      if (!user) {
        setTransactions([]); setBudgets([]); setReady(true); return;
      }
      if (!useApi) {
        setReady(true); return;
      }
      try {
        await refreshData();
        if (!cancelled) setReady(true);
      } catch (e) {
        console.error("Initial load failed", e);
        if (!cancelled) setReady(true);
      }
    })();
    return () => { cancelled = true; };
  }, [user, useApi, refreshData]);

  

  const addTransaction: AppContextValue["addTransaction"] = useCallback(async (tx) => {
    const id = crypto.randomUUID();
    const createdAt = toUTC();
    const normalizedTx = { ...tx, date: toUTC(tx.date) };
    const newTx: Transaction = { ...normalizedTx, id, createdAt };
    
    // Optimistic Update
    setTransactions((s) => [newTx, ...s]);
    
    if (useApi) {
      try {
        await api("/transactions", {
          method: "POST",
          body: JSON.stringify({ ...normalizedTx, id }),
        });
      } catch (e) {
        setTransactions((s) => s.filter((t) => t.id !== id));
        throw e;
      }
    }
    return newTx;
  }, [useApi]);

  const updateTransaction: AppContextValue["updateTransaction"] = useCallback(async (id, patch) => {
    const normalizedPatch = patch.date ? { ...patch, date: toUTC(patch.date) } : patch;
    
    setTransactions((s) => s.map((t) => (t.id === id ? { ...t, ...normalizedPatch } : t)));
    
    if (useApi) {
      try {
        await api(`/transactions/${id}`, { 
          method: "PATCH", 
          body: JSON.stringify(normalizedPatch) 
        });
      } catch (e) {
        await refreshData();
        throw e;
      }
    }
  }, [useApi, refreshData]);

  const deleteTransaction: AppContextValue["deleteTransaction"] = useCallback(async (id) => {
    const old = transactions;
    setTransactions((s) => s.filter((t) => t.id !== id));
    
    if (useApi) {
      try {
        await api(`/transactions/${id}`, { method: "DELETE" });
      } catch (e) {
        setTransactions(old);
        throw e;
      }
    }
  }, [useApi, transactions]);

  const addCategory: AppContextValue["addCategory"] = useCallback((cat) => {
    const newCat: Category = { ...cat, id: crypto.randomUUID(), isCustom: true };
    setLocal((l) => ({ ...l, categories: [...l.categories, newCat] }));
    return newCat;
  }, []);

  const deleteCategory: AppContextValue["deleteCategory"] = useCallback((id) => {
    setLocal((l) => ({ ...l, categories: l.categories.filter((c) => c.id !== id) }));
    setBudgets((s) => s.filter((b) => b.categoryId !== id));
    if (useApi) api(`/budgets/${id}`, { method: "DELETE" }).catch(console.error);
  }, [useApi]);

  const setBudget: AppContextValue["setBudget"] = useCallback((categoryId, limit) => {
    setBudgets((s) => {
      const exists = s.find((b) => b.categoryId === categoryId);
      return exists ? s.map((b) => (b.categoryId === categoryId ? { ...b, limit } : b)) : [...s, { categoryId, limit }];
    });
    if (useApi) api("/budgets", { 
      method: "PUT", 
      body: JSON.stringify({ categoryId, limit: new Decimal(limit).toFixed(2) }) 
    }).catch(console.error);
  }, [useApi]);

  const removeBudget: AppContextValue["removeBudget"] = useCallback((categoryId) => {
    setBudgets((s) => s.filter((b) => b.categoryId !== categoryId));
    if (useApi) api(`/budgets/${categoryId}`, { method: "DELETE" }).catch(console.error);
  }, [useApi]);

  const setCurrency = useCallback((c: Currency) => {
    setLocal((l) => ({ ...l, settings: { ...l.settings, currency: c } }));
  }, []);
  
  const toggleTheme = useCallback(() => {
    setLocal((l) => ({ ...l, settings: { ...l.settings, theme: l.settings.theme === "dark" ? "light" : "dark" } }));
  }, []);

  const resetData = useCallback(() => {
    setLocal({ categories: DEFAULT_CATEGORIES, settings: { currency: "INR", theme: "dark" } });
    setTransactions([]); setBudgets([]);
    if (useApi) {
      api("/transactions", { method: "DELETE" }).catch(console.error);
      api("/budgets", { method: "DELETE" }).catch(console.error);
    }
  }, [useApi]);

  const getCategory = useCallback((id: string) => local.categories.find((c) => c.id === id), [local.categories]);

  const value = useMemo<AppContextValue>(() => ({
    transactions, budgets, categories: local.categories, settings: local.settings, ready,
    addTransaction, updateTransaction, deleteTransaction,
    addCategory, deleteCategory, setBudget, removeBudget,
    setCurrency, toggleTheme, resetData, getCategory, refreshData,
  }), [transactions, budgets, local, ready, addTransaction, updateTransaction, deleteTransaction, addCategory, deleteCategory, setBudget, removeBudget, setCurrency, toggleTheme, resetData, getCategory, refreshData]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
