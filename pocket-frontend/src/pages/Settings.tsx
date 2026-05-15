import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Moon, Sun, Trash2, Plus, RotateCcw, Download, Sparkles, LogOut, ChevronRight, User, Shield, Palette, Database } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
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
import { Switch } from "@/components/ui/switch";
import { useApp } from "@/store/AppContext";
import { PageHeader } from "@/components/PageHeader";
import { CategoryIcon, COLOR_OPTIONS, ICON_OPTIONS } from "@/components/CategoryIcon";
import type { Currency } from "@/lib/types";
import { cn } from "@/lib/utils";
import { exportTransactionsCSV } from "@/lib/export";

export default function Settings() {
  const { settings, setCurrency, toggleTheme, categories, addCategory, deleteCategory, resetData, transactions } = useApp();
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState(ICON_OPTIONS[0]);
  const [color, setColor] = useState(COLOR_OPTIONS[0]);
  const [type, setType] = useState<"expense" | "income">("expense");

  const submit = () => {
    if (!name.trim()) return toast.error("Please name your category");
    addCategory({ name: name.trim(), icon, color, type });
    toast.success("Category created successfully");
    setOpen(false);
    setName("");
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out");
  };

  return (
    <div className="space-y-10 pb-20 max-w-4xl mx-auto px-6 pt-6">
      <header className="animate-in fade-in slide-in-from-top-4 duration-700">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60 mb-2">Configurations</p>
        <h1 className="font-display text-4xl font-black tracking-tight text-foreground">Preferences</h1>
        <p className="mt-2 text-sm text-muted-foreground/80 font-medium">Customize your financial dashboard and data.</p>
      </header>

      {/* Profile Section */}
      <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
         <div className="glass-card rounded-[2rem] border border-white/10 p-8 shadow-2xl relative overflow-hidden group">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/5 blur-3xl transition-opacity group-hover:opacity-20" />
            
            <div className="flex flex-col md:flex-row md:items-center gap-6 relative z-10">
               <div className="h-20 w-20 rounded-3xl bg-gradient-primary flex items-center justify-center shadow-glow text-white text-3xl font-black">
                  {user?.email?.[0].toUpperCase()}
               </div>
               <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold tracking-tight mb-1">{user?.displayName || "Financial Strategist"}</h2>
                  <p className="text-sm text-muted-foreground font-medium mb-3">{user?.email}</p>
                  <div className="flex flex-wrap gap-2">
                     <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/10 text-[10px] font-bold text-primary uppercase tracking-widest">
                        PRO ACCOUNT
                     </span>
                     <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted/40 border border-white/5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        SECURED WITH JWT
                     </span>
                  </div>
               </div>
               <Button variant="outline" onClick={handleSignOut} className="rounded-2xl h-12 px-6 font-bold hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 border-white/5 bg-background/40">
                  <LogOut className="mr-2 h-4 w-4" strokeWidth={3} /> Sign Out
               </Button>
            </div>
         </div>
      </section>

      <div className="grid gap-10 lg:grid-cols-2 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
        {/* Core Settings */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
             <Shield className="h-4 w-4 text-primary" />
             <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/70">System Preferences</h3>
          </div>
          <div className="glass-card rounded-[2.5rem] border border-white/10 p-4 shadow-xl">
            <SettingRow
              icon={<Sparkles className="h-4 w-4" />}
              title="Base Currency"
              description="Primary currency for all calculations"
              right={
                <Select value={settings.currency} onValueChange={(v) => setCurrency(v as Currency)}>
                  <SelectTrigger className="h-10 w-28 rounded-xl bg-background/50 border-white/5 font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl bg-card/90 backdrop-blur-xl border-white/10">
                    <SelectItem value="INR">INR ₹</SelectItem>
                    <SelectItem value="USD">USD $</SelectItem>
                    <SelectItem value="EUR">EUR €</SelectItem>
                    <SelectItem value="GBP">GBP £</SelectItem>
                  </SelectContent>
                </Select>
              }
            />
            <Divider />
            <SettingRow
              icon={settings.theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              title="Appearance"
              description="Switch between light and dark UI"
              right={<Switch checked={settings.theme === "dark"} onCheckedChange={toggleTheme} className="data-[state=checked]:bg-primary" />}
            />
            <Divider />
            <SettingRow
              icon={<Download className="h-4 w-4" />}
              title="Data Export"
              description={`${transactions.length} total records`}
              right={
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl h-10 px-4 font-bold border-white/5 bg-background/50 hover:bg-primary hover:text-white transition-all"
                  onClick={() => {
                    if (!transactions.length) return toast.error("No data to export");
                    exportTransactionsCSV(transactions, categories, settings.currency);
                    toast.success("Financial records exported");
                  }}
                >
                  Export CSV
                </Button>
              }
            />
          </div>
        </section>

        {/* Categories Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
               <Palette className="h-4 w-4 text-primary" />
               <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/70">Visual Taxonomy</h3>
            </div>
            <Button size="sm" variant="ghost" onClick={() => setOpen(true)} className="rounded-xl h-8 px-3 font-bold uppercase tracking-widest text-[10px] text-primary hover:bg-primary/10">
              <Plus className="mr-1 h-3.5 w-3.5" strokeWidth={3} /> New Category
            </Button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
            <AnimatePresence mode="popLayout">
              {categories.map((c) => (
                <motion.div
                  key={c.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="group relative flex items-center gap-3 rounded-2xl bg-white/[0.03] border border-white/5 p-3.5 transition-all hover:bg-white/[0.08] hover:border-white/10"
                >
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl shadow-inner group-hover:scale-110 transition-transform"
                    style={{ backgroundColor: `hsl(${c.color} / 0.12)`, color: `hsl(${c.color})` }}
                  >
                    <CategoryIcon name={c.icon} className="h-5 w-5" strokeWidth={2.5} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold tracking-tight">{c.name}</p>
                    <p className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground/50">{c.type}</p>
                  </div>
                  {c.isCustom && (
                    <button
                      onClick={() => {
                        deleteCategory(c.id);
                        toast.success("Category archived");
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-muted-foreground hover:text-destructive"
                      aria-label="Delete category"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>
      </div>

      {/* Danger Zone */}
      <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
        <div className="flex items-center gap-2 px-1 mb-4">
           <Database className="h-4 w-4 text-destructive" />
           <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/70 text-destructive/80">Danger Zone</h3>
        </div>
        <div className="glass-card rounded-[2.5rem] border border-destructive/20 bg-destructive/5 p-4 shadow-xl">
           <SettingRow
             icon={<RotateCcw className="h-4 w-4 text-destructive" />}
             title="Wipe Account Data"
             description="Permanently delete all transaction history and budgets"
             right={
               <Button
                 size="sm"
                 variant="ghost"
                 className="rounded-xl h-10 px-6 font-bold text-destructive hover:bg-destructive hover:text-white transition-all shadow-glow-sm"
                 onClick={() => {
                    if (confirm("Are you absolutely sure? This cannot be undone.")) {
                       resetData();
                       toast.success("Database cleared");
                    }
                 }}
               >
                 Factory Reset
               </Button>
             }
           />
        </div>
      </section>

      <footer className="pt-10 pb-4 text-center">
         <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/40 border border-white/5">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/60">
               Pocket Engine v1.0.4 · Production Build
            </p>
         </div>
      </footer>

      {/* New category dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[420px] rounded-[2rem] glass-card border-white/10 p-6 shadow-2xl">
          <DialogHeader className="space-y-1.5">
            <DialogTitle className="font-display text-2xl font-bold tracking-tight">New Category</DialogTitle>
            <DialogDescription className="text-xs font-medium text-muted-foreground/60 uppercase tracking-widest">
               Design a new label for your finances
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 my-2">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70 ml-1">Identity</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Subscriptions" className="rounded-2xl h-12 bg-background/40 border-white/5 focus:ring-primary/20" />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70 ml-1">Context</Label>
              <div className="flex p-1.5 bg-muted/30 rounded-2xl border border-white/5">
                {(["expense", "income"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className={cn(
                      "flex-1 py-2 text-sm font-bold uppercase tracking-widest rounded-xl transition-all",
                      type === t ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70 ml-1">Color Palette</Label>
              <div className="flex flex-wrap gap-2.5 p-1">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={cn(
                      "h-8 w-8 rounded-full border-2 transition-all hover:scale-110",
                      color === c ? "border-foreground ring-2 ring-foreground/20 ring-offset-2 ring-offset-background" : "border-transparent"
                    )}
                    style={{ background: `hsl(${c})` }}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70 ml-1">Symbol</Label>
              <div className="grid grid-cols-7 gap-2 rounded-2xl border border-white/5 bg-background/20 p-3 max-h-[160px] overflow-y-auto no-scrollbar">
                {ICON_OPTIONS.map((i) => (
                  <button
                    key={i}
                    onClick={() => setIcon(i)}
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-xl transition-all",
                      icon === i ? "bg-primary text-white shadow-glow-sm scale-110" : "bg-muted/40 text-muted-foreground hover:bg-muted"
                    )}
                  >
                    <CategoryIcon name={i} className="h-5 w-5" strokeWidth={2.5} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="flex-row gap-3 mt-4">
            <Button variant="ghost" className="flex-1 rounded-2xl h-12 font-bold text-muted-foreground hover:bg-background/40" onClick={() => setOpen(false)}>Cancel</Button>
            <Button className="flex-1 rounded-2xl h-12 bg-gradient-primary text-white font-bold shadow-lg shadow-primary/25 hover:scale-[1.02]" onClick={submit}>Create Category</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SettingRow({
  icon, title, description, right,
}: { icon: React.ReactNode; title: string; description: string; right: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 px-4 py-5 hover:bg-white/[0.02] transition-colors rounded-2xl">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-muted/40 text-primary border border-white/5">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold tracking-tight text-foreground">{title}</p>
        <p className="text-[11px] font-medium text-muted-foreground/60 leading-tight">{description}</p>
      </div>
      <div className="shrink-0 ml-4">
        {right}
      </div>
    </div>
  );
}

function Divider() {
  return <div className="mx-4 h-px bg-white/5" />;
}
