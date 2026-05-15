import { useMemo, useState, useEffect } from "react";
import { Plus, Trash2, AlertTriangle, Repeat, PieChart as PieChartIcon, Calendar, ArrowRight, ArrowUpRight, TrendingDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApp } from "@/store/AppContext";
import { CategoryIcon } from "@/components/CategoryIcon";
import { Currency } from "@/components/ui/Currency";
import { SYMBOLS } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { getMonthRangeUTC, toIST } from "@/lib/date";
import dayjs from "dayjs";
import Decimal from "decimal.js";
import { api } from "@/lib/api";

type Tab = "budgets" | "recurring";

export default function Budgets() {
  const { categories, budgets, transactions, settings, setBudget, removeBudget } = useApp();
  const [tab, setTab] = useState<Tab>("budgets");
  const [open, setOpen] = useState(false);
  const [recurringOpen, setRecurringOpen] = useState(false);
  
  // Budget Form
  const [catId, setCatId] = useState("");
  const [limit, setLimit] = useState("");

  // Recurring Form
  const [recTitle, setRecTitle] = useState("");
  const [recAmount, setRecAmount] = useState("");
  const [recType, setRecType] = useState<"income" | "expense">("expense");
  const [recCatId, setRecCatId] = useState("");
  const [recFreq, setRecFreq] = useState("monthly");
  const [recStart, setRecStart] = useState(dayjs().format("YYYY-MM-DD"));

  const [recurringTxs, setRecurringTxs] = useState<any[]>([]);

  const fetchRecurring = async () => {
    try {
      const data = await api<any[]>("/recurring");
      setRecurringTxs(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchRecurring();
  }, []);

  const { spent, totalLimit, totalSpent } = useMemo(() => {
    const { start, end } = getMonthRangeUTC();
    const startD = dayjs(start);
    const endD = dayjs(end);

    const m = new Map<string, Decimal>();
    for (const t of transactions) {
      if (t.type !== "expense") continue;
      const d = dayjs(t.date);
      if (d.isBefore(startD) || d.isAfter(endD)) continue;
      
      const current = m.get(t.categoryId) || new Decimal(0);
      m.set(t.categoryId, current.plus(t.amount));
    }

    const tLimit = budgets.reduce((s, b) => s.plus(b.limit), new Decimal(0));
    const tSpent = budgets.reduce((s, b) => s.plus(m.get(b.categoryId) || 0), new Decimal(0));

    return { spent: m, totalLimit: tLimit, totalSpent: tSpent };
  }, [transactions, budgets]);

  const expenseCats = categories.filter((c) => c.type === "expense");
  const availableForBudget = expenseCats.filter((c) => !budgets.find((b) => b.categoryId === c.id));

  const submitBudget = () => {
    if (!catId) return toast.error("Please pick a category");
    const n = new Decimal(limit || "0");
    if (n.lte(0)) return toast.error("Please enter a valid limit");
    
    setBudget(catId, n.toNumber());
    toast.success("Budget tracking enabled");
    setOpen(false);
    setCatId("");
    setLimit("");
  };

  const submitRecurring = async () => {
    if (!recTitle.trim()) return toast.error("Please name the transaction");
    if (!recCatId) return toast.error("Please pick a category");
    
    const n = new Decimal(recAmount || "0");
    if (n.lte(0)) return toast.error("Please enter a valid amount");

    try {
      await api("/recurring", {
        method: "POST",
        body: JSON.stringify({
          title: recTitle.trim(),
          amount: n.toNumber(),
          type: recType,
          categoryId: recCatId,
          
          frequency: recFreq,
          startDate: recStart,
        }),
      });
      toast.success("Recurring transaction scheduled");
      fetchRecurring();
      setRecurringOpen(false);
      setRecTitle("");
      setRecAmount("");
    } catch (e) {
      toast.error("Failed to schedule transaction");
    }
  };

  const deleteRecurring = async (id: string) => {
    try {
      await api(`/recurring/${id}`, { method: "DELETE" });
      toast.success("Recurring schedule removed");
      fetchRecurring();
    } catch (e) {
      toast.error("Failed to delete schedule");
    }
  };

  return (
    <div className="space-y-8 pb-20 max-w-5xl mx-auto px-6 pt-6">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60 mb-2">Automations & Limits</p>
          <h1 className="font-display text-4xl font-black tracking-tight text-foreground">Planning</h1>
        </div>
        
        <div className="flex p-1.5 bg-muted/30 rounded-2xl border border-white/5 backdrop-blur-xl">
           <button 
             onClick={() => setTab("budgets")}
             className={cn(
               "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
               tab === "budgets" ? "bg-background text-primary shadow-lg shadow-primary/5" : "text-muted-foreground hover:text-foreground"
             )}
           >
             <PieChartIcon className="h-4 w-4" /> Budgets
           </button>
           <button 
             onClick={() => setTab("recurring")}
             className={cn(
               "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
               tab === "recurring" ? "bg-background text-primary shadow-lg shadow-primary/5" : "text-muted-foreground hover:text-foreground"
             )}
           >
             <Repeat className="h-4 w-4" /> Recurring
           </button>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {tab === "budgets" ? (
          <motion.div
            key="budgets"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            {/* Total Monthly Overview */}
            <div className="glass-card rounded-[2.5rem] border border-white/10 p-8 shadow-2xl relative overflow-hidden group">
               <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/60 mb-1">Monthly Ceiling</p>
                    <div className="flex items-baseline gap-3">
                       <Currency value={totalSpent} currency={settings.currency} size="2xl" className="text-4xl font-black tracking-tighter" />
                       <span className="text-sm font-bold text-muted-foreground/50">/ <Currency value={totalLimit} currency={settings.currency} /></span>
                    </div>
                  </div>
                  <Button 
                    onClick={() => setOpen(true)}
                    className="rounded-2xl h-12 px-6 bg-gradient-primary text-white shadow-lg shadow-primary/25 hover:scale-[1.02] font-bold"
                  >
                    <Plus className="mr-2 h-5 w-5" strokeWidth={3} /> New Budget
                  </Button>
               </div>
               
               <div className="mt-8 relative z-10">
                  <div className="h-3 w-full bg-muted/40 rounded-full overflow-hidden border border-white/5">
                     <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${totalLimit.gt(0) ? Math.min(100, totalSpent.div(totalLimit).times(100).toNumber()) : 0}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={cn(
                          "h-full rounded-full transition-all duration-1000",
                          totalSpent.gt(totalLimit) ? "bg-expense shadow-glow-sm shadow-expense/50" : "bg-gradient-primary shadow-glow-sm shadow-primary/50"
                        )}
                     />
                  </div>
                  <div className="flex justify-between mt-3">
                     <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                        {totalLimit.gt(0) ? `${totalSpent.div(totalLimit).times(100).toFixed(0)}% utilized` : "No limit set"}
                     </p>
                     {totalSpent.gt(totalLimit) && (
                        <p className="text-[10px] font-bold text-expense uppercase tracking-widest flex items-center gap-1">
                           <AlertTriangle className="h-3 w-3" /> Overspent by <Currency value={totalSpent.minus(totalLimit)} currency={settings.currency} />
                        </p>
                     )}
                  </div>
               </div>
            </div>

            {/* Category Budgets Grid */}
            <div className="grid gap-6 md:grid-cols-2">
               {budgets.map((b, i) => {
                  const cat = categories.find(c => c.id === b.categoryId);
                  if (!cat) return null;
                  const used = spent.get(b.categoryId) || new Decimal(0);
                  const pct = new Decimal(b.limit).gt(0) ? used.div(b.limit).times(100).toNumber() : 0;
                  const isOver = used.gt(b.limit);
                  
                  return (
                    <motion.div
                      key={b.categoryId}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="glass-card rounded-[2rem] border border-white/5 p-6 hover:border-white/10 transition-all group"
                    >
                      <div className="flex items-center gap-4 mb-5">
                         <div 
                           className="h-12 w-12 rounded-2xl flex items-center justify-center shadow-inner"
                           style={{ backgroundColor: `hsl(${cat.color} / 0.12)`, color: `hsl(${cat.color})` }}
                         >
                            <CategoryIcon name={cat.icon} className="h-6 w-6" strokeWidth={2.5} />
                         </div>
                         <div className="flex-1 min-w-0">
                            <h3 className="font-bold tracking-tight text-foreground">{cat.name}</h3>
                            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/50">Category Budget</p>
                         </div>
                         <button 
                           onClick={() => removeBudget(b.categoryId)}
                           className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-muted-foreground hover:text-expense"
                         >
                            <Trash2 className="h-4 w-4" />
                         </button>
                      </div>

                      <div className="space-y-3">
                         <div className="flex justify-between items-baseline">
                            <Currency value={used} currency={settings.currency} size="lg" className={cn("font-black tracking-tight", isOver ? "text-expense" : "text-foreground")} />
                            <span className="text-xs font-bold text-muted-foreground/40">of <Currency value={b.limit} currency={settings.currency} /></span>
                         </div>
                         
                         <div className="h-1.5 w-full bg-muted/30 rounded-full overflow-hidden">
                            <motion.div 
                               initial={{ width: 0 }}
                               animate={{ width: `${Math.min(100, pct)}%` }}
                               className={cn(
                                 "h-full transition-all duration-1000",
                                 isOver ? "bg-expense" : pct > 85 ? "bg-warning" : "bg-primary"
                               )}
                            />
                         </div>
                         
                         {isOver && (
                           <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-expense/10 border border-expense/10 text-[9px] font-black text-expense uppercase tracking-widest">
                              <AlertTriangle className="h-3 w-3" /> Critical: Budget Exceeded
                           </div>
                         )}
                      </div>
                    </motion.div>
                  );
               })}
               
               {budgets.length === 0 && (
                 <div className="col-span-full py-20 flex flex-col items-center justify-center text-center border-2 border-dashed border-white/5 rounded-[2.5rem]">
                    <PieChartIcon className="h-12 w-12 text-muted-foreground/20 mb-4" />
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">No Active Budgets</p>
                    <p className="text-xs text-muted-foreground/40 mt-2">Set monthly spending limits for your categories.</p>
                 </div>
               )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="recurring"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            <div className="flex items-center justify-between px-2">
               <div>
                  <h3 className="text-xl font-bold tracking-tight">Recurring Schedules</h3>
                  <p className="text-sm text-muted-foreground/70 font-medium">Automated income and expense records.</p>
               </div>
               <Button 
                onClick={() => setRecurringOpen(true)}
                className="rounded-2xl h-12 px-6 bg-gradient-primary text-white shadow-lg shadow-primary/25 hover:scale-[1.02] font-bold"
              >
                <Plus className="mr-2 h-5 w-5" strokeWidth={3} /> Schedule Task
              </Button>
            </div>

            <div className="grid gap-4">
               {recurringTxs.map((r, i) => {
                  const cat = categories.find(c => c.id === r.category_id);
                  const acc = undefined;
                  const isIncome = r.type === "income";
                  
                  return (
                    <motion.div
                      key={r.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="glass-card group rounded-3xl border border-white/5 p-4 flex items-center gap-4 hover:border-white/10 transition-all"
                    >
                      <div 
                        className="h-12 w-12 rounded-2xl flex items-center justify-center shadow-inner"
                        style={{ backgroundColor: cat ? `hsl(${cat.color} / 0.12)` : "hsl(var(--muted)/0.1)", color: cat ? `hsl(${cat.color})` : "inherit" }}
                      >
                         <CategoryIcon name={cat?.icon || "Repeat"} className="h-6 w-6" strokeWidth={2.5} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                         <h4 className="font-bold tracking-tight truncate">{r.title}</h4>
                         <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">{r.frequency}</span>
                            <span className="text-muted-foreground/30">•</span>
                            <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest truncate">System Account</span>
                         </div>
                      </div>
                      
                      <div className="text-right">
                         <div className="flex items-center justify-end gap-1.5 mb-1">
                            <Calendar className="h-3 w-3 text-muted-foreground/40" />
                            <span className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest">Next: {dayjs(r.next_date).format("MMM D")}</span>
                         </div>
                         <Currency value={r.amount} currency={settings.currency} className={cn("font-black tracking-tight", isIncome ? "text-income" : "text-foreground")} />
                      </div>
                      
                      <button 
                        onClick={() => deleteRecurring(r.id)}
                        className="ml-2 p-2 text-muted-foreground/40 hover:text-expense transition-colors"
                      >
                         <Trash2 className="h-4 w-4" />
                      </button>
                    </motion.div>
                  );
               })}
               
               {recurringTxs.length === 0 && (
                  <div className="py-20 flex flex-col items-center justify-center text-center border-2 border-dashed border-white/5 rounded-[2.5rem]">
                    <Repeat className="h-12 w-12 text-muted-foreground/20 mb-4 animate-spin-slow" />
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">No Automations Active</p>
                    <p className="text-xs text-muted-foreground/40 mt-2">Schedule recurring bills, salaries, or subscriptions.</p>
                 </div>
               )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Budget Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[420px] rounded-[2rem] glass-card border-white/10 p-6 shadow-2xl">
          <DialogHeader className="space-y-1.5">
            <DialogTitle className="font-display text-2xl font-bold tracking-tight">Set Expenditure Limit</DialogTitle>
            <DialogDescription className="text-xs font-medium text-muted-foreground/60 uppercase tracking-widest">
               Define your monthly spending target
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 my-2">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70 ml-1">Expense Category</Label>
              <Select value={catId} onValueChange={setCatId}>
                <SelectTrigger className="rounded-2xl h-12 bg-background/40 border-white/5">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-white/10 bg-card/90 backdrop-blur-xl">
                  {availableForBudget.length === 0 ? (
                    <div className="p-4 text-xs font-bold text-muted-foreground text-center">No categories available.</div>
                  ) : availableForBudget.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <div className="flex items-center gap-2.5">
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
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70 ml-1">Monthly Ceiling ({SYMBOLS[settings.currency]})</Label>
              <Input
                inputMode="decimal"
                value={limit}
                onChange={(e) => setLimit(e.target.value.replace(/[^0-9.]/g, ""))}
                placeholder="0.00"
                className="rounded-2xl h-12 bg-background/40 border-white/5 focus:ring-primary/20 text-xl font-bold"
              />
            </div>
          </div>

          <DialogFooter className="flex-row gap-3 mt-4">
            <Button variant="ghost" className="flex-1 rounded-2xl h-12 font-bold text-muted-foreground hover:bg-background/40" onClick={() => setOpen(false)}>Cancel</Button>
            <Button className="flex-1 rounded-2xl h-12 bg-gradient-primary text-white font-bold shadow-lg shadow-primary/25 hover:scale-[1.02]" onClick={submitBudget}>Activate Budget</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Recurring Dialog */}
      <Dialog open={recurringOpen} onOpenChange={setRecurringOpen}>
        <DialogContent className="max-w-[440px] rounded-[2rem] glass-card border-white/10 p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
          <DialogHeader className="space-y-1.5">
            <DialogTitle className="font-display text-2xl font-bold tracking-tight">Schedule Task</DialogTitle>
            <DialogDescription className="text-xs font-medium text-muted-foreground/60 uppercase tracking-widest">
               Automate your frequent transactions
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 my-2">
            {/* Type toggle */}
            <div className="relative flex p-1.5 bg-muted/40 rounded-2xl border border-white/5">
              <button
                type="button"
                onClick={() => setRecType("expense")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-xl transition-all duration-300",
                  recType === "expense" ? "bg-expense text-white shadow-lg" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Expense
              </button>
              <button
                type="button"
                onClick={() => setRecType("income")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-xl transition-all duration-300",
                  recType === "income" ? "bg-income text-white shadow-lg" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Income
              </button>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70 ml-1">Title</Label>
              <Input value={recTitle} onChange={(e) => setRecTitle(e.target.value)} placeholder="e.g. Netflix Subscription" className="rounded-2xl h-12 bg-background/40 border-white/5 focus:ring-primary/20" />
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70 ml-1">Amount</Label>
                 <Input value={recAmount} onChange={(e) => setRecAmount(e.target.value)} placeholder="0.00" className="rounded-2xl h-12 bg-background/40 border-white/5 focus:ring-primary/20 font-bold" />
               </div>
               <div className="space-y-2">
                 <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70 ml-1">Frequency</Label>
                 <Select value={recFreq} onValueChange={setRecFreq}>
                    <SelectTrigger className="rounded-2xl h-12 bg-background/40 border-white/5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-white/10 bg-card/90 backdrop-blur-xl">
                       <SelectItem value="daily">Daily</SelectItem>
                       <SelectItem value="weekly">Weekly</SelectItem>
                       <SelectItem value="monthly">Monthly</SelectItem>
                       <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                 </Select>
               </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70 ml-1">Category</Label>
                <Select value={recCatId} onValueChange={setRecCatId}>
                  <SelectTrigger className="rounded-2xl h-12 bg-background/40 border-white/5">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-white/10 bg-card/90 backdrop-blur-xl">
                    {categories.filter(c => c.type === recType).map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
               <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70 ml-1">First Execution Date</Label>
               <Input type="date" value={recStart} onChange={(e) => setRecStart(e.target.value)} className="rounded-2xl h-12 bg-background/40 border-white/5" />
            </div>
          </div>

          <DialogFooter className="flex-row gap-3 mt-4">
            <Button variant="ghost" className="flex-1 rounded-2xl h-12 font-bold text-muted-foreground hover:bg-background/40" onClick={() => setRecurringOpen(false)}>Cancel</Button>
            <Button className="flex-1 rounded-2xl h-12 bg-gradient-primary text-white font-bold shadow-lg shadow-primary/25 hover:scale-[1.02]" onClick={submitRecurring}>Save Schedule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
