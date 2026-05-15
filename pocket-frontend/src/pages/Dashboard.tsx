import { useMemo, useState, type ReactNode } from "react";
import { Sparkles, ArrowRight, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import { useApp } from "@/store/AppContext";
import { useAuth } from "@/hooks/useAuth";
import { BalanceCard } from "@/components/BalanceCard";
import { SpendingPie } from "@/components/SpendingPie";
import { MonthlyBars } from "@/components/MonthlyBars";
import { TransactionItem } from "@/components/TransactionItem";
import { TransactionDialog } from "@/components/TransactionDialog";
import { Currency } from "@/components/ui/Currency";
import { toIST, getMonthRangeUTC } from "@/lib/date";
import { cn } from "@/lib/utils";
import type { Transaction } from "@/lib/types";
import Decimal from "decimal.js";
import dayjs from "dayjs";

export default function Dashboard() {
  const { transactions, settings } = useApp();
  const { user } = useAuth();
  const [editing, setEditing] = useState<Transaction | null>(null);

  const { monthIncome, monthExpense, totalBalance, recent, savingsRate } = useMemo(() => {
    const { start, end } = getMonthRangeUTC();
    const startD = dayjs(start);
    const endD = dayjs(end);

    let mi = new Decimal(0);
    let me = new Decimal(0);

    // Compute net balance from transactions (income - expense)
    let totalBalance = new Decimal(0);
    for (const t of transactions) {
      const amt = new Decimal(t.amount);
      if (t.type === "income") totalBalance = totalBalance.plus(amt);
      else if (t.type === "expense") totalBalance = totalBalance.minus(amt);
    }

    for (const t of transactions) {
      const amount = new Decimal(t.amount);
      const d = dayjs(t.date);

      // Monthly filter
      if ((d.isAfter(startD) || d.isSame(startD)) && (d.isBefore(endD) || d.isSame(endD))) {
        if (t.type === "income") mi = mi.plus(amount);
        else if (t.type === "expense") me = me.plus(amount);
      }
    }

    const recent = [...transactions]
      .sort((a, b) => dayjs(b.date).unix() - dayjs(a.date).unix())
      .slice(0, 6);

    const savings = mi.gt(0) ? Decimal.max(0, mi.minus(me).div(mi).times(100)) : new Decimal(0);

    return {
      monthIncome: mi.toNumber(),
      monthExpense: me.toNumber(),
      totalBalance: totalBalance.toNumber(),
      recent,
      savingsRate: savings.toNumber(),
    };
  }, [transactions]);

  const greeting = (() => {
    const h = toIST(new Date()).hour();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  })();

  const name = user?.displayName || user?.email?.split("@")[0] || "there";

  return (
    <div className="space-y-6">
      <header className="animate-in fade-in slide-in-from-top-4 duration-700">
        <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
          {toIST(new Date()).format("EEEE, MMMM d")}
        </p>
        <h1 className="mt-1 font-display text-2xl font-bold tracking-tight md:text-4xl text-foreground">
          {greeting}, <span className="text-primary">{name}</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground/80">Here's a snapshot of your finances this month.</p>
      </header>

      {/* KPI grid */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
        <KpiCard
          label="Net balance"
          value={totalBalance}
          currency={settings.currency}
          accent="primary"
          icon={<Wallet className="h-4 w-4" />}
        />
        <KpiCard
          label="Income (month)"
          value={monthIncome}
          currency={settings.currency}
          accent="income"
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <KpiCard
          label="Expenses (month)"
          value={monthExpense}
          currency={settings.currency}
          accent="expense"
          icon={<TrendingDown className="h-4 w-4" />}
        />
        <KpiCard
          label="Savings rate"
          value={savingsRate}
          isPercent
          accent="muted"
          icon={<Sparkles className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-6">
          <div className="glass-card rounded-3xl border border-white/10 p-6 shadow-xl shadow-primary/5">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg font-bold">Monthly trend</h2>
                <p className="text-xs text-muted-foreground">Income vs expenses · last 6 months</p>
              </div>
              <div className="h-10 w-10 flex items-center justify-center rounded-2xl bg-primary/10">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="h-[300px]">
              <MonthlyBars />
            </div>
          </div>

          <div className="glass-card rounded-3xl border border-white/10 p-6 shadow-xl shadow-primary/5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Recent activity</h2>
              <Link to="/transactions" className="group flex items-center gap-1.5 text-xs font-semibold text-primary">
                See all <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
            <div className="space-y-3">
              {recent.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="mb-4 h-16 w-16 rounded-full bg-muted/30 flex items-center justify-center">
                    <Wallet className="h-8 w-8 text-muted-foreground/40" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">No transactions yet.</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Start by adding your first income or expense.</p>
                </div>
              ) : (
                recent.map((t, i) => (
                  <TransactionItem key={t.id} tx={t} index={i} onClick={() => setEditing(t)} />
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <BalanceCard income={monthIncome} expense={monthExpense} balance={totalBalance} />

          <div className="glass-card rounded-3xl border border-white/10 p-6 shadow-xl shadow-primary/5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg font-bold">Spending by category</h2>
                <p className="text-xs text-muted-foreground">{toIST(new Date()).format("MMMM yyyy")}</p>
              </div>
            </div>
            <div className="h-[280px]">
              <SpendingPie startDate={dayjs(getMonthRangeUTC().start).toDate()} endDate={dayjs(getMonthRangeUTC().end).toDate()} />
            </div>
          </div>
        </div>
      </div>

      <TransactionDialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)} editing={editing} />
    </div>
  );
}

function KpiCard({
  label, value, icon, accent, currency, isPercent = false
}: {
  label: string;
  value: number;
  icon: ReactNode;
  accent: "primary" | "income" | "expense" | "muted";
  currency?: any;
  isPercent?: boolean;
}) {
  const accentClass = {
    primary: "bg-primary/10 text-primary shadow-glow-sm",
    income: "bg-income/10 text-income",
    expense: "bg-expense/10 text-expense",
    muted: "bg-muted/50 text-foreground",
  }[accent];

  return (
    <div className="glass-card group overflow-hidden rounded-3xl border border-white/10 p-6 shadow-xl transition-all hover:border-white/20 hover:shadow-2xl">
      <div className="flex items-center justify-between relative z-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">{label}</p>
        <span className={`flex h-10 w-10 items-center justify-center rounded-2xl transition-transform group-hover:scale-110 ${accentClass}`}>
          {icon}
        </span>
      </div>
      <div className="mt-4 relative z-10">
        {isPercent ? (
          <p className="font-display text-3xl font-bold tracking-tight tabular-nums">
            {value.toFixed(0)}<span className="text-lg text-muted-foreground ml-0.5">%</span>
          </p>
        ) : (
          <Currency value={value} currency={currency} size="2xl" />
        )}
      </div>
      
      {/* Decorative background element */}
      <div className={cn(
        "absolute -bottom-6 -right-6 h-24 w-24 rounded-full blur-3xl opacity-10 transition-opacity group-hover:opacity-20",
        accent === "primary" && "bg-primary",
        accent === "income" && "bg-income",
        accent === "expense" && "bg-expense",
        accent === "muted" && "bg-muted"
      )} />
    </div>
  );
}
