import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Wallet, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";

export default function Auth() {
  const { user, loading, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.title = "Sign in — Pocket";
  }, []);

  if (loading) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-gradient-surface">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (user) return <Navigate to="/" replace />;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return toast.error("Email and password required");
    if (mode === "signup" && password.length < 8) {
      return toast.error("Password must be at least 8 characters");
    }
    setBusy(true);
    const { error } =
      mode === "login"
        ? await signIn(email, password)
        : await signUp(email, password, displayName.trim() || email.split("@")[0]);
    setBusy(false);
    if (error) {
      toast.error(error);
      return;
    }
    if (mode === "signup") toast.success("Welcome to Pocket!");
    navigate("/", { replace: true });
  };

  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-gradient-surface px-4 py-10">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/4 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute right-1/4 bottom-1/4 h-[300px] w-[300px] rounded-full bg-expense/10 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-sm rounded-3xl border border-border/60 bg-card/80 p-6 shadow-elevated backdrop-blur-xl"
      >
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold tracking-tight">Pocket</h1>
            <p className="text-xs text-muted-foreground">Your money, beautifully tracked.</p>
          </div>
        </div>

        <Tabs value={mode} onValueChange={(v) => setMode(v as "login" | "signup")}>
          <TabsList className="grid w-full grid-cols-2 rounded-xl">
            <TabsTrigger value="login" className="rounded-lg">Log in</TabsTrigger>
            <TabsTrigger value="signup" className="rounded-lg">Sign up</TabsTrigger>
          </TabsList>

          <form onSubmit={onSubmit} className="mt-5 space-y-3">
            <TabsContent value="signup" className="m-0 space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-medium">Display name</Label>
                <Input
                  id="name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Alex"
                  className="rounded-xl"
                />
              </div>
            </TabsContent>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="rounded-xl"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-medium">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="rounded-xl"
                required
                minLength={mode === "signup" ? 8 : undefined}
              />
              {mode === "signup" && (
                <p className="text-[11px] text-muted-foreground">At least 8 characters.</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={busy}
              className="mt-2 w-full rounded-xl bg-gradient-primary text-primary-foreground hover:opacity-90"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === "login" ? "Log in" : "Create account"}
            </Button>
          </form>
        </Tabs>

        <p className="mt-5 text-center text-[11px] text-muted-foreground">
          By continuing you agree to keep tracking every cent. ✨
        </p>
      </motion.div>
    </div>
  );
}
