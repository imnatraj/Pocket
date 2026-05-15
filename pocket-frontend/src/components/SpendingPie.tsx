import { useMemo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useApp } from "@/store/AppContext";
import { formatCurrency } from "@/lib/currency";
import dayjs from "dayjs";
import Decimal from "decimal.js";
import { cn } from "@/lib/utils";

interface Props {
  startDate?: Date;
  endDate?: Date;
}

export function SpendingPie({ startDate, endDate }: Props) {
  const { transactions, categories, settings } = useApp();

  const data = useMemo(() => {
    const map = new Map<string, Decimal>();
    const startD = startDate ? dayjs(startDate) : null;
    const endD = endDate ? dayjs(endDate) : null;

    for (const t of transactions) {
      if (t.type !== "expense") continue;
      const d = dayjs(t.date);
      if (startD && d.isBefore(startD)) continue;
      if (endD && d.isAfter(endD)) continue;
      
      const current = map.get(t.categoryId) || new Decimal(0);
      map.set(t.categoryId, current.plus(t.amount));
    }
    
    return Array.from(map.entries())
      .map(([categoryId, value]) => {
        const c = categories.find((c) => c.id === categoryId);
        return { 
          name: c?.name ?? "Other", 
          value: value.toNumber(), 
          color: c?.color ?? "220 10% 50%" 
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [transactions, categories, startDate, endDate]);

  const total = useMemo(() => 
    data.reduce((s, d) => s.plus(d.value), new Decimal(0)), 
  [data]);

  if (!data.length) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center py-10">
        <div className="h-16 w-16 rounded-full bg-muted/20 flex items-center justify-center mb-3">
          <PieChart className="h-8 w-8 text-muted-foreground/30" />
        </div>
        <p className="text-xs font-bold text-muted-foreground/60 uppercase tracking-widest">No expenses found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full justify-between">
      <div className="relative h-48 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={55}
              outerRadius={75}
              paddingAngle={4}
              stroke="none"
              animationDuration={1000}
              animationBegin={0}
            >
              {data.map((d, i) => (
                <Cell 
                  key={i} 
                  fill={`hsl(${d.color})`} 
                  className="hover:opacity-80 transition-opacity cursor-pointer shadow-glow"
                  style={{ filter: "drop-shadow(0px 4px 8px rgba(0,0,0,0.15))" }}
                />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  const pct = total.gt(0) ? new Decimal(d.value).div(total).times(100).toFixed(1) : "0";
                  return (
                    <div className="glass-card border border-white/10 rounded-2xl p-3 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="h-2.5 w-2.5 rounded-full" style={{ background: `hsl(${d.color})` }} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">{d.name}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-black tabular-nums">{formatCurrency(d.value, settings.currency)}</span>
                        <span className="text-[10px] font-bold text-muted-foreground/60">{pct}% of total</span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center mt-1">
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Spent</span>
          <span className="font-display text-lg font-black tracking-tight leading-none mt-0.5">
            {formatCurrency(total.toNumber(), settings.currency, { compact: true })}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2.5 px-2">
        {data.slice(0, 4).map((d) => {
          const pct = total.gt(0) ? new Decimal(d.value).div(total).times(100).toNumber() : 0;
          return (
            <div key={d.name} className="flex items-center justify-between gap-4 group/item">
              <div className="flex min-w-0 items-center gap-3">
                <div className="h-3 w-3 rounded-full shadow-sm ring-2 ring-background ring-offset-2 transition-transform group-hover/item:scale-125" style={{ background: `hsl(${d.color})` }} />
                <span className="truncate text-xs font-bold text-foreground/80 tracking-tight group-hover/item:text-foreground transition-colors">{d.name}</span>
              </div>
              <div className="flex items-center gap-3">
                 <div className="w-16 h-1 bg-muted/30 rounded-full overflow-hidden hidden sm:block">
                    <div className="h-full bg-current transition-all duration-1000" style={{ width: `${pct}%`, color: `hsl(${d.color})` }} />
                 </div>
                 <span className="text-[11px] font-black tabular-nums text-muted-foreground/70">{Math.round(pct)}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
