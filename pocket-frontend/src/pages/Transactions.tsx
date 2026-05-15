import { useMemo, useState, useEffect, useRef } from "react";
import { Search, Download, Filter, X, Calendar as CalendarIcon, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApp } from "@/store/AppContext";
import { TransactionItem } from "@/components/TransactionItem";
import type { Transaction } from "@/lib/types";
import { PageHeader } from "@/components/PageHeader";
import { exportTransactionsCSV } from "@/lib/export";
import { cn } from "@/lib/utils";
import { toIST, toUTC } from "@/lib/date";
import { CategoryIcon } from "@/components/CategoryIcon";
import Decimal from "decimal.js";
import dayjs from "dayjs";

export default function Transactions() {
  const { transactions, categories, settings, addTransaction, updateTransaction, deleteTransaction } = useApp();
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [query, setQuery] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const fromD = from ? dayjs(from).startOf("day") : null;
    const toD = to ? dayjs(to).endOf("day") : null;

    return transactions
      .filter((t) => {
        if (q && !t.title.toLowerCase().includes(q) && !t.note?.toLowerCase().includes(q)) return false;
        if (filterCat !== "all" && t.categoryId !== filterCat) return false;
        if (filterType !== "all" && t.type !== filterType) return false;
        
        const d = dayjs(t.date);
        if (fromD && (d.isBefore(fromD))) return false;
        if (toD && (d.isAfter(toD))) return false;
        
        return true;
      })
      .sort((a, b) => dayjs(b.date).unix() - dayjs(a.date).unix());
  }, [transactions, query, from, to, filterCat, filterType]);

  const grouped = useMemo(() => {
    const m = new Map<string, Transaction[]>();
    for (const t of filtered) {
      // Group by IST date string
      const key = toIST(t.date).format("YYYY-MM-DD");
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(t);
    }
    return Array.from(m.entries());
  }, [filtered]);

  const handleExport = () => {
    if (!filtered.length) return toast.error("Nothing to export");
    exportTransactionsCSV(filtered, categories, settings.currency);
    toast.success("CSV exported successfully");
  };

  const clearFilters = () => {
    setFrom("");
    setTo("");
    setFilterCat("all");
    setFilterType("all");
    setQuery("");
  };

  const hasFilters = from || to || filterCat !== "all" || filterType !== "all" || query;

  return (
    <div className="space-y-4 pb-10">
      <div className="px-5 pt-4">
        <PageHeader
          title="Transactions"
          subtitle={`${filtered.length} of ${transactions.length} entries`}
          right={
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={handleExport}
                className="rounded-2xl border-white/10 bg-card/50 backdrop-blur-sm shadow-xl"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="default"
                onClick={() => { setShowForm((s) => !s); setEditing(null); }}
                className="rounded-2xl h-11 bg-gradient-primary text-white shadow-lg shadow-primary/25 hover:opacity-90"
              >
                <Plus className="mr-2 h-4 w-4" />
                {showForm ? "Close form" : "Add transaction"}
              </Button>
            </div>
          }
        />
      </div>

      <div className="space-y-4 px-5">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search transactions..."
              className="rounded-2xl pl-10 border-white/5 bg-card/40 backdrop-blur-sm h-11 focus:ring-primary/20"
            />
          </div>
          <Button
            variant={showFilters || (hasFilters && !query) ? "default" : "outline"}
            size="icon"
            className="rounded-2xl h-11 w-11 border-white/5 bg-card/40 backdrop-blur-sm"
            onClick={() => setShowFilters((s) => !s)}
          >
            <Filter className={cn("h-4 w-4", showFilters && "animate-pulse")} />
          </Button>
        </div>

        {showFilters && (
          <div className="glass-card rounded-3xl border border-white/10 p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80 ml-1">From Date</label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40 pointer-events-none" />
                  <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-xl pl-9 bg-background/50 border-white/5" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80 ml-1">To Date</label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40 pointer-events-none" />
                  <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-xl pl-9 bg-background/50 border-white/5" />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80 ml-1">Type</label>
                <Select value={filterType} onValueChange={(v) => setFilterType(v as typeof filterType)}>
                  <SelectTrigger className="rounded-xl bg-background/50 border-white/5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-white/10 bg-card/90 backdrop-blur-xl">
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80 ml-1">Category</label>
                <Select value={filterCat} onValueChange={setFilterCat}>
                  <SelectTrigger className="rounded-xl bg-background/50 border-white/5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-white/10 bg-card/90 backdrop-blur-xl max-h-[300px]">
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="w-full mt-4 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-destructive/10 hover:text-destructive">
                <X className="mr-1.5 h-3.5 w-3.5" /> Reset Filters
              </Button>
            )}
          </div>
        )}
      </div>

      {(showForm || editing) && (
        <div className="space-y-5 px-5">
          <div className="glass-card rounded-3xl border border-white/10 p-5 shadow-2xl">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold">{editing ? "Edit Transaction" : "Add Transaction"}</h2>
                <p className="text-sm text-muted-foreground">Use this page form to add or update a transaction with full scroll support.</p>
              </div>
              <Button variant="outline" size="icon" onClick={() => { setShowForm(false); setEditing(null); }}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <TransactionPageForm
              editing={editing}
              categories={categories}
              currency={settings.currency}
              onSaved={() => { setShowForm(false); setEditing(null); }}
              onCancel={() => { setShowForm(false); setEditing(null); }}
              addTransaction={addTransaction}
              updateTransaction={updateTransaction}
              deleteTransaction={deleteTransaction}
            />
          </div>
        </div>
      )}

      <div className="space-y-8 px-5 mt-4">
        {grouped.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-700">
            <div className="mb-4 h-20 w-20 rounded-full bg-muted/20 flex items-center justify-center border border-dashed border-white/10">
              <Search className="h-10 w-10 text-muted-foreground/30" />
            </div>
            <p className="text-sm font-bold text-muted-foreground/80 uppercase tracking-widest">No transactions found</p>
            <p className="text-xs text-muted-foreground/50 mt-1.5">Try adjusting your search or filters.</p>
          </div>
        ) : (
          grouped.map(([day, items], groupIndex) => (
            <div key={day} className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${groupIndex * 50}ms` }}>
              <div className="flex items-center gap-3 px-1">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary/80">
                  {toIST(day).format("dddd, MMM D")}
                </h3>
                <div className="h-px flex-1 bg-gradient-to-r from-primary/20 to-transparent" />
              </div>
              <div className="grid gap-3">
                {items.map((t, i) => (
                  <TransactionItem key={t.id} tx={t} index={i} onClick={() => setEditing(t)} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function TransactionPageForm({
  editing,
  categories,
  currency,
  onSaved,
  onCancel,
  addTransaction,
  updateTransaction,
  deleteTransaction,
}: {
  editing: Transaction | null;
  categories: { id: string; name: string; icon: string; color: string; type: string }[];
  currency: string;
  onSaved: () => void;
  onCancel: () => void;
  addTransaction: (tx: Omit<Transaction, "id" | "createdAt">) => Promise<Transaction>;
  updateTransaction: (id: string, patch: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
}) {
  const [type, setType] = useState<"income" | "expense">("expense");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  
  const [date, setDate] = useState(toIST(new Date()).format("YYYY-MM-DD"));
  const [note, setNote] = useState("");
  const [receipt, setReceipt] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const filteredCats = useMemo(() => categories.filter((c) => c.type === type), [categories, type]);

  useEffect(() => {
    if (editing) {
    setType((editing.type as string) === "transfer" ? "expense" : editing.type as "income" | "expense");
      setTitle(editing.title);
      setAmount(new Decimal(editing.amount).toFixed(2));
      setCategoryId(editing.categoryId);
      setDate(toIST(editing.date).format("YYYY-MM-DD"));
      setNote(editing.note ?? "");
      setReceipt(editing.receipt);
    } else {
      setTitle("");
      setAmount("");
      setCategoryId(""); // Will be picked up by the other useEffect
      setDate(toIST(new Date()).format("YYYY-MM-DD"));
      setNote("");
      setReceipt(undefined);
    }
  }, [editing]);

  useEffect(() => {
    if (!filteredCats.some((c) => c.id === categoryId)) {
      setCategoryId(filteredCats[0]?.id || "");
    }
  }, [filteredCats, categoryId]);

  const handleReceipt = (file?: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image too large", { description: "Max 5 MB." });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setReceipt(reader.result as string);
    reader.readAsDataURL(file);
  };

  const submit = async () => {
    if (isSubmitting) return;
    if (!title.trim()) return toast.error("Please add a title");
    if (!date) return toast.error("Please choose a date");
    if (!categoryId) return toast.error("Please pick a category");

    let numericAmount;
    try {
      numericAmount = new Decimal(amount.trim() || "0");
      if (numericAmount.lte(0)) throw new Error();
    } catch {
      return toast.error("Please enter a valid amount");
    }

    const payload = {
      title: title.trim(),
      amount: numericAmount.toNumber(),
      type,
      categoryId,
      date: toUTC(date),
      note: note.trim() || undefined,
      receipt,
    };

    setIsSubmitting(true);
    try {
      if (editing) {
        await updateTransaction(editing.id, payload);
        toast.success("Transaction updated successfully");
      } else {
        await addTransaction(payload);
        toast.success("Transaction saved successfully");
      }
      onSaved();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to save transaction";
      toast.error("Failed to save transaction", { description: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!editing) return;
    try {
      await deleteTransaction(editing.id);
      toast.success("Transaction deleted");
      onSaved();
    } catch (e) {
      toast.error("Failed to delete transaction");
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="glass-card rounded-3xl border border-white/10 bg-background/40 p-5 shadow-xl shadow-primary/5">
          <div className="space-y-3">
            <div className="grid gap-3">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 ml-1">Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setType("expense")}
                    className={cn(
                      "rounded-2xl border px-4 py-3 text-sm font-semibold transition",
                      type === "expense" ? "bg-expense text-white border-expense" : "bg-background/70 text-muted-foreground hover:bg-background"
                    )}
                  >
                    Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => setType("income")}
                    className={cn(
                      "rounded-2xl border px-4 py-3 text-sm font-semibold transition",
                      type === "income" ? "bg-income text-white border-income" : "bg-background/70 text-muted-foreground hover:bg-background"
                    )}
                  >
                    Income
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="tx-title" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 ml-1">Title</label>
                <Input
                  id="tx-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Groceries"
                  className="rounded-2xl bg-background/50 border-white/5"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="tx-amount" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 ml-1">Amount</label>
                <Input
                  id="tx-amount"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1"))}
                  placeholder="0.00"
                  className="rounded-2xl bg-background/50 border-white/5"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-3xl border border-white/10 bg-background/40 p-5 shadow-xl shadow-primary/5">
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 ml-1">Category</label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="rounded-2xl bg-background/50 border-white/5">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-white/10 bg-card/90 backdrop-blur-xl max-h-[300px]">
                  {filteredCats.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-lg" style={{ backgroundColor: `hsl(${c.color} / 0.15)`, color: `hsl(${c.color})` }}>
                          <CategoryIcon name={c.icon} className="h-3.5 w-3.5" strokeWidth={2.5} />
                        </span>
                        <span className="font-semibold">{c.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label htmlFor="tx-date" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 ml-1">Date</label>
              <Input
                id="tx-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="rounded-2xl bg-background/50 border-white/5"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-3xl border border-white/10 bg-background/40 p-5 shadow-xl shadow-primary/5">
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="tx-note" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 ml-1">Notes</label>
            <Input
              id="tx-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional notes"
              className="rounded-2xl bg-background/50 border-white/5"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 ml-1">Receipt</label>
            <div className="flex items-center gap-3">
              <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} className="rounded-2xl">
                Attach image
              </Button>
              {receipt && <span className="text-sm text-muted-foreground">Receipt attached</span>}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleReceipt(e.target.files?.[0])} />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        {editing ? (
          <Button type="button" variant="outline" onClick={handleDelete} className="rounded-2xl w-full sm:w-auto text-destructive border-destructive">
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </Button>
        ) : null}
        <Button type="button" onClick={submit} disabled={isSubmitting} className="rounded-2xl w-full sm:w-auto bg-gradient-primary text-white shadow-lg shadow-primary/25 disabled:opacity-60">
          {editing ? "Update transaction" : "Save transaction"}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel} className="rounded-2xl w-full sm:w-auto text-muted-foreground hover:bg-background/60">
          Cancel
        </Button>
      </div>
    </div>
  );
}
