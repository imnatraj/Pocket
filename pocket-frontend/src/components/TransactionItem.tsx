import { motion } from "framer-motion";
import { CategoryIcon } from "./CategoryIcon";
import { useApp } from "@/store/AppContext";
import { Currency } from "./ui/Currency";
import type { Transaction } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatIST, toIST } from "@/lib/date";
import dayjs from "dayjs";

interface Props {
  tx: Transaction;
  onClick?: () => void;
  index?: number;
}

function formatDay(iso: string) {
  const d = toIST(iso);
  const now = toIST(new Date());
  
  if (d.isSame(now, "day")) return "Today";
  if (d.isSame(now.subtract(1, "day"), "day")) return "Yesterday";
  return d.format("MMM D");
}

export function TransactionItem({ tx, onClick, index = 0 }: Props) {
  const { getCategory, settings } = useApp();
  const cat = getCategory(tx.categoryId);
  const isIncome = tx.type === "income";

  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.4), duration: 0.3, ease: "easeOut" }}
      whileTap={{ scale: 0.98 }}
      className="group flex w-full items-center gap-4 rounded-2xl bg-card/40 p-3 text-left border border-white/5 shadow-sm transition-all hover:bg-card-elevated hover:shadow-md hover:border-white/10"
    >
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-inner transition-transform group-hover:scale-105"
        style={{
          backgroundColor: cat ? `hsl(${cat.color} / 0.12)` : "hsl(var(--muted) / 0.2)",
          color: cat ? `hsl(${cat.color})` : "hsl(var(--muted-foreground))",
        }}
      >
        <CategoryIcon name={cat?.icon ?? "HelpCircle"} className="h-6 w-6" strokeWidth={2} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-bold text-foreground tracking-tight group-hover:text-primary transition-colors">
            {tx.title}
          </p>
          {tx.receipt && (
            <div className="h-1.5 w-1.5 rounded-full bg-primary shadow-glow-sm" aria-label="Has receipt" />
          )}
        </div>
        <p className="truncate text-[11px] font-medium text-muted-foreground/70 uppercase tracking-wider">
          {cat?.name ?? "Uncategorized"} • {formatDay(tx.date)}
        </p>
      </div>

      <div className="text-right">
        <div className={cn(
          "flex items-center justify-end font-display text-sm font-bold tabular-nums",
          isIncome ? "text-income" : "text-foreground"
        )}>
          <Currency 
            value={isIncome ? tx.amount : -tx.amount} 
            currency={settings.currency} 
            showSign 
            className={isIncome ? "text-income" : ""} 
          />
        </div>
        {tx.note && (
          <p className="truncate text-[10px] text-muted-foreground/50 mt-0.5 max-w-[80px] ml-auto">
            {tx.note}
          </p>
        )}
      </div>
    </motion.button>
  );
}
