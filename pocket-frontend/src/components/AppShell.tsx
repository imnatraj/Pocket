import { ReactNode, useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, Receipt, PiggyBank, Settings as SettingsIcon, Wallet, LogOut, Menu, X, ArrowUpRight, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/transactions", label: "Transactions", icon: Receipt },
  { to: "/budgets", label: "Budgets", icon: PiggyBank },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
];

export function AppShell({ children }: { children?: ReactNode }) {
  const [mobileNav, setMobileNav] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen w-full bg-background selection:bg-primary/20 selection:text-primary">
      {/* Dynamic background gradients */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-20 top-0 h-[600px] w-[600px] rounded-full bg-primary/5 blur-[120px] animate-pulse duration-[10s]" />
        <div className="absolute right-0 bottom-0 h-[500px] w-[500px] rounded-full bg-income/5 blur-[100px] animate-pulse duration-[8s]" />
      </div>

      <div className="flex min-h-screen">
        {/* Sidebar — desktop */}
        <aside className="hidden w-72 shrink-0 border-r border-white/5 bg-card/30 backdrop-blur-3xl lg:flex lg:flex-col shadow-2xl">
          <SidebarContent onSignOut={handleSignOut} user={user} />
        </aside>

        {/* Sidebar — mobile drawer */}
        <AnimatePresence>
          {mobileNav && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-background/60 backdrop-blur-md" 
                onClick={() => setMobileNav(false)} 
              />
              <motion.aside 
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="relative h-full w-80 border-r border-white/10 bg-card shadow-2xl"
              >
                <button onClick={() => setMobileNav(false)} className="absolute right-4 top-4 rounded-full p-2 bg-muted/20 hover:bg-muted transition-colors" aria-label="Close menu">
                  <X className="h-5 w-5" />
                </button>
                <SidebarContent onSignOut={handleSignOut} user={user} onNavigate={() => setMobileNav(false)} />
              </motion.aside>
            </div>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Global Header */}
          <header className="sticky top-0 z-40 flex h-20 items-center justify-between gap-4 border-b border-white/5 bg-background/40 px-6 backdrop-blur-2xl lg:px-10">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMobileNav(true)}
                className="rounded-xl p-2.5 bg-muted/40 hover:bg-muted lg:hidden transition-colors"
                aria-label="Open menu"
              >
                <Menu className="h-6 w-6" />
              </button>
              
              {/* Breadcrumb or Contextual info could go here */}
              <div className="hidden lg:flex items-center gap-2">
                 <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/10">
                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-[11px] font-bold uppercase tracking-widest text-primary/80">Live Portfolio</span>
                 </div>
              </div>
            </div>

            <div className="flex items-center gap-4" />
          </header>

          <main className="flex-1">
            <motion.div
              layout
              className="mx-auto w-full max-w-7xl"
            >
              <Outlet />
            </motion.div>
          </main>
        </div>
      </div>

      {/* Transaction dialog removed from header — use Transactions page instead */}
    </div>
  );
}

function SidebarContent({
  onSignOut,
  user,
  onNavigate,
}: {
  onSignOut: () => void;
  user?: any;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      {/* Brand Logo */}
      <div className="flex items-center gap-4 px-8 py-10">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-primary text-white shadow-glow relative overflow-hidden group">
          <Wallet className="h-6 w-6 relative z-10 transition-transform group-hover:scale-110" strokeWidth={2.5} />
          <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-black tracking-tight leading-none bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
            Pocket
          </h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary/60 mt-1">PFM Suite</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 px-4">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "group flex items-center gap-4 rounded-2xl px-5 py-4 text-sm font-bold transition-all duration-300",
                isActive
                  ? "bg-primary/10 text-primary shadow-sm border border-primary/10"
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
              )
            }
          >
            {({ isActive }) => (
              <>
                <div className={cn(
                  "p-2 rounded-xl transition-colors",
                  isActive ? "bg-primary text-white shadow-glow-sm" : "bg-muted/40 group-hover:bg-muted"
                )}>
                  <Icon className="h-4 w-4" strokeWidth={isActive ? 3 : 2} />
                </div>
                <span className="tracking-tight">{label}</span>
                {isActive && (
                  <motion.div 
                    layoutId="active-indicator" 
                    className="ml-auto h-1.5 w-1.5 rounded-full bg-primary shadow-glow-sm" 
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Quick stats removed per user request */}

      {/* User & Footer */}
      <div className="mt-auto border-t border-white/5 p-6 bg-white/[0.02]">
        {user && (
          <div className="flex items-center gap-4 px-2 mb-6">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-muted-foreground/20 to-muted-foreground/5 border border-white/10 flex items-center justify-center font-bold text-muted-foreground">
               {user.email?.[0].toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold tracking-tight text-foreground">{user.displayName || user.email.split("@")[0]}</p>
              <p className="truncate text-[10px] text-muted-foreground/60">{user.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={onSignOut}
          className="group flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-xs font-bold text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive"
        >
          <div className="p-2 rounded-xl bg-muted/40 group-hover:bg-destructive/10 transition-colors">
            <LogOut className="h-4 w-4" />
          </div>
          <span className="tracking-widest uppercase">Sign Out</span>
        </button>
      </div>
    </div>
  );
}
