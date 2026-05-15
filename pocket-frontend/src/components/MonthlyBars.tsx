import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts";
import { useApp } from "@/store/AppContext";
import { formatCurrency } from "@/lib/currency";
import { toIST } from "@/lib/date";
import dayjs from "dayjs";
import Decimal from "decimal.js";

export function MonthlyBars() {
  const { transactions, settings } = useApp();

  const data = useMemo(() => {
    const months: { key: string; label: string; income: Decimal; expense: Decimal }[] = [];
    const now = toIST(new Date());
    
    for (let i = 5; i >= 0; i--) {
      const d = now.subtract(i, "month").startOf("month");
      months.push({ 
        key: d.format("YYYY-MM"), 
        label: d.format("MMM"), 
        income: new Decimal(0), 
        expense: new Decimal(0) 
      });
    }
    
    const idx = new Map(months.map((m, i) => [m.key, i]));

    for (const t of transactions) {
      const k = toIST(t.date).format("YYYY-MM");
      const i = idx.get(k);
      if (i === undefined) continue;
      
      const amount = new Decimal(t.amount);
      if (t.type === "income") months[i].income = months[i].income.plus(amount);
      else if (t.type === "expense") months[i].expense = months[i].expense.plus(amount);
    }
    
    return months.map(m => ({
      ...m,
      income: m.income.toNumber(),
      expense: m.expense.toNumber()
    }));
  }, [transactions]);

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }} barGap={8}>
          <defs>
            <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--income))" stopOpacity={0.9} />
              <stop offset="100%" stopColor="hsl(var(--income))" stopOpacity={0.4} />
            </linearGradient>
            <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--expense))" stopOpacity={0.9} />
              <stop offset="100%" stopColor="hsl(var(--expense))" stopOpacity={0.4} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="hsl(var(--border) / 0.3)" strokeDasharray="4 4" vertical={false} />
          <XAxis 
            dataKey="label" 
            tickLine={false} 
            axisLine={false} 
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11, fontWeight: 600 }} 
            dy={10}
          />
          <YAxis 
            tickLine={false} 
            axisLine={false} 
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10, fontWeight: 500 }} 
            width={40} 
          />
          <Tooltip
            cursor={{ fill: "hsl(var(--muted) / 0.2)", radius: 10 }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="glass-card border border-white/10 rounded-2xl p-3 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-2 border-b border-white/5 pb-1">
                      {payload[0].payload.label} Overview
                    </p>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-[11px] font-bold text-income">Income</span>
                        <span className="text-xs font-black tabular-nums">{formatCurrency(payload[0].value as number, settings.currency)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-[11px] font-bold text-expense">Expenses</span>
                        <span className="text-xs font-black tabular-nums">{formatCurrency(payload[1].value as number, settings.currency)}</span>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="income" fill="url(#incomeGradient)" radius={[6, 6, 4, 4]} />
          <Bar dataKey="expense" fill="url(#expenseGradient)" radius={[6, 6, 4, 4]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
