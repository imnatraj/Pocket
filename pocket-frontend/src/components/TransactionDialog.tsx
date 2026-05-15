import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, X, Trash2, Calendar as CalendarIcon, Type, Plus, Minus } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApp } from "@/store/AppContext";
import type { Transaction } from "@/lib/types";
import { CategoryIcon } from "./CategoryIcon";
import { SYMBOLS } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { toIST, toUTC } from "@/lib/date";
import Decimal from "decimal.js";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing?: Transaction | null;
}

type TxType = "income" | "expense";

export function TransactionDialog({ open, onOpenChange, editing }: Props) {
  const { categories, settings, addTransaction, updateTransaction, deleteTransaction } = useApp();
  const [type, setType] = useState<TxType>("expense");
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
    if (!open) return;
    if (editing) {
      setType(editing.type as TxType);
      setTitle(editing.title);
      setAmount(new Decimal(editing.amount).toFixed(2));
      setCategoryId(editing.categoryId);
      setDate(toIST(editing.date).format("YYYY-MM-DD"));
      setNote(editing.note ?? "");
      setReceipt(editing.receipt);
    } else {
      setType("expense");
      setTitle("");
      setAmount("");
      setCategoryId(filteredCats[0]?.id || "");
      
      setDate(toIST(new Date()).format("YYYY-MM-DD"));
      setNote("");
      setReceipt(undefined);
    }
  }, [open, editing, filteredCats]);

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

  useEffect(() => {
    if (!filteredCats.some((c) => c.id === categoryId)) {
      setCategoryId(filteredCats[0]?.id || "");
    }
  }, [filteredCats, categoryId]);

  const submit = async () => {
    if (isSubmitting) return;
    if (!title.trim()) return toast.error("Please add a title");

    if (!date) return toast.error("Please choose a date");
    if (!categoryId) return toast.error("Please pick a category");

    let numericAmount;
    try {
      const amountString = amount.trim();
      numericAmount = new Decimal(amountString || "0");
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
        toast.success("Transaction saved", {
          description: `${type === "income" ? "+" : "−"}${SYMBOLS[settings.currency]}${numericAmount.toFixed(2)} added to ${title}`,
        });
      }
      onOpenChange(false);
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
      onOpenChange(false);
    } catch (e) {
      toast.error("Failed to delete transaction");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] max-w-[440px] gap-6 overflow-y-auto rounded-[2rem] p-6 sm:max-w-[440px] glass-card border-white/10 shadow-2xl">
        <DialogHeader className="space-y-1.5">
          <DialogTitle className="font-display text-2xl font-bold tracking-tight">
            {editing ? "Edit Entry" : "New Entry"}
          </DialogTitle>
          <DialogDescription className="text-xs font-medium text-muted-foreground/60 uppercase tracking-widest">
            {editing ? "Modify your financial record" : "Track your latest transaction"}
          </DialogDescription>
        </DialogHeader>

        {/* Type toggle */}
        <div className="relative flex p-1.5 bg-muted/40 rounded-2xl border border-white/5">
          <button
            type="button"
            onClick={() => setType("expense")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 z-10",
              type === "expense" ? "bg-expense text-white shadow-lg shadow-expense/20" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Minus className="h-4 w-4" strokeWidth={3} /> Expense
          </button>
          <button
            type="button"
            onClick={() => setType("income")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 z-10",
              type === "income" ? "bg-income text-white shadow-lg shadow-income/20" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Plus className="h-4 w-4" strokeWidth={3} /> Income
          </button>
        </div>

        {/* Amount Input */}
        <div className="group relative rounded-3xl border border-white/10 bg-background/40 p-6 text-center transition-all hover:border-primary/20 hover:bg-background/60">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50 mb-2">Amount</div>
          <div className="flex items-center justify-center gap-2 font-display">
            <span className="text-2xl font-bold text-primary/40 transition-colors group-hover:text-primary/60">{SYMBOLS[settings.currency]}</span>
            <input
              autoFocus
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1"))}
              placeholder="0.00"
              className="w-48 bg-transparent text-center text-5xl font-bold tracking-tighter outline-none placeholder:text-muted-foreground/20 text-foreground"
            />
          </div>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70 ml-1">What was this for?</Label>
            <div className="relative">
              <Type className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40 pointer-events-none" />
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Starbucks Coffee"
                className="rounded-2xl h-12 pl-11 bg-background/40 border-white/5 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70 ml-1">Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="rounded-2xl h-12 bg-background/40 border-white/5">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-white/10 bg-card/90 backdrop-blur-xl">
                  {filteredCats.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <div className="flex items-center gap-2.5">
                        <span
                          className="flex h-6 w-6 items-center justify-center rounded-lg shadow-sm"
                          style={{ backgroundColor: `hsl(${c.color} / 0.15)`, color: `hsl(${c.color})` }}
                        >
                          <CategoryIcon name={c.icon} className="h-3.5 w-3.5" strokeWidth={2.5} />
                        </span>
                        <span className="font-semibold">{c.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date" className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70 ml-1">Date</Label>
            <div className="relative">
              <CalendarIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40 pointer-events-none" />
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="rounded-2xl h-12 pl-11 bg-background/40 border-white/5"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="note" className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70 ml-1">Notes (Optional)</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Any details about this transaction..."
              rows={2}
              className="rounded-2xl bg-background/40 border-white/5 focus:ring-primary/20 resize-none py-3"
            />
          </div>

          {/* Receipt Upload */}
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70 ml-1">Receipt Image</Label>
            {receipt ? (
              <div className="relative group overflow-hidden rounded-2xl border border-white/10 shadow-lg">
                <img src={receipt} alt="Receipt preview" className="h-40 w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => setReceipt(undefined)}
                    className="h-10 w-10 flex items-center justify-center rounded-full bg-destructive text-white shadow-xl hover:scale-110 transition-transform"
                    aria-label="Remove receipt"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-white/5 bg-background/20 py-6 text-xs font-bold text-muted-foreground/40 transition-all hover:bg-background/40 hover:border-primary/20 hover:text-primary/60"
              >
                <div className="h-10 w-10 rounded-full bg-muted/20 flex items-center justify-center mb-1">
                  <Camera className="h-5 w-5" />
                </div>
                CLICK TO ATTACH RECEIPT
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => handleReceipt(e.target.files?.[0])}
            />
          </div>

        <DialogFooter className="mt-2 flex-row gap-3 sm:flex-row sm:justify-between">
          <div className="w-full flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {editing ? (
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handleDelete} 
              className="rounded-2xl h-12 w-12 border-white/5 bg-background/20 text-destructive hover:bg-destructive hover:text-white transition-all"
            >
              <Trash2 className="h-5 w-5" />
            </Button>
          ) : <div className="hidden sm:block" />}
          <div className="flex flex-1 gap-3">
            <Button 
              variant="ghost" 
              onClick={() => onOpenChange(false)} 
              className="flex-1 rounded-2xl h-12 font-bold text-muted-foreground hover:bg-background/40"
              type="button"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-2xl h-12 font-bold bg-gradient-primary text-white shadow-lg shadow-primary/25 hover:scale-[1.02] transition-transform active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none"
            >
              {editing ? "Update Record" : "Save Record"}
            </Button>
          </div>
        </div>
        </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
