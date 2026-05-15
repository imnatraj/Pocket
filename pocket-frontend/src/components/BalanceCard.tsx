import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, ArrowDownRight, ArrowUpRight } from "lucide-react";
import { useState } from "react";
import { useApp } from "@/store/AppContext";
import { Currency } from "./ui/Currency";
import { cn } from "@/lib/utils";
import Decimal from "decimal.js";

interface Props {
  income: number;
  expense: number;
  balance: number;
}

export function BalanceCard({ income, expense, balance }: Props) {
  const { settings } = useApp();
  const [hidden, setHidden] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="group relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-8 text-white shadow-2xl shadow-primary/30"
    >
      {/* Premium Glass Overlays */}
      <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl animate-pulse" />
      <div className="absolute -bottom-20 -left-10 h-72 w-72 rounded-full bg-black/15 blur-3xl" />
      <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-50 pointer-events-none" />

      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-2 w-2 rounded-full bg-white/60 animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-[0.25em] text-white/70">
              Net Worth
            </span>
          </div>
          <button
            onClick={() => setHidden((h) => !h)}
            aria-label={hidden ? "Show balance" : "Hide balance"}
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md transition-all hover:bg-white/25 hover:scale-110 active:scale-95"
          >
            {hidden ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>

        <div className="mt-4 flex flex-col">
          <AnimatePresence mode="wait">
            {hidden ? (
              <motion.div
                key="hidden"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="font-display text-5xl font-black tracking-tighter"
              >
                ••••••••
              </motion.div>
            ) : (
              <motion.div
                key="visible"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Currency 
                  value={balance} 
                  currency={settings.currency} 
                  size="2xl" 
                  className="text-5xl font-black tracking-tighter text-white" 
                />
              </motion.div>
            )}
          </AnimatePresence>
          <div className="mt-1 text-[10px] font-bold text-white/50 uppercase tracking-widest ml-1">
            Consolidated Portfolio
          </div>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-4">
          <Stat 
            label="Inflow" 
            value={income} 
            hidden={hidden}
            currency={settings.currency}
            icon={<ArrowDownRight className="h-4 w-4" strokeWidth={2.5} />} 
            tone="up" 
          />
          <Stat 
            label="Outflow" 
            value={expense} 
            hidden={hidden}
            currency={settings.currency}
            icon={<ArrowUpRight className="h-4 w-4" strokeWidth={2.5} />} 
            tone="down" 
          />
        </div>
      </div>
    </motion.div>
  );
}

function Stat({ 
  label, value, icon, tone, hidden, currency 
}: { 
  label: string; value: number; icon: React.ReactNode; tone: "up" | "down"; hidden: boolean; currency: any;
}) {
  return (
    <div className="rounded-3xl bg-white/10 p-4 backdrop-blur-xl border border-white/5 shadow-inner group/stat transition-all hover:bg-white/15">
      <div className="flex items-center gap-2 mb-2">
        <span
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-xl transition-transform group-hover/stat:scale-110",
            tone === "up" ? "bg-income text-white shadow-lg shadow-income/20" : "bg-black/30 text-white"
          )}
        >
          {icon}
        </span>
        <span className="text-[10px] font-black uppercase tracking-widest text-white/60">{label}</span>
      </div>
      <div className="font-display text-lg font-black tracking-tight text-white pl-1">
        {hidden ? "••••" : (
          <Currency value={value} currency={currency} size="lg" className="text-white" />
        )}
      </div>
    </div>
  );
}
