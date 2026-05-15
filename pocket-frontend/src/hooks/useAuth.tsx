import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { api, tokenStore, isApiConfigured, ApiError } from "@/lib/api";

export interface AuthUser {
  id: string;
  email: string;
  displayName?: string;
}

interface AuthCtx {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);
const LOCAL_USER_KEY = "pocket.local.user";

// Demo offline mode: when no API is configured, we let the UI work
// against localStorage with a synthetic local user. The bundled Node/MySQL
// backend replaces this once VITE_API_URL is set.
const loadLocalUser = (): AuthUser | null => {
  try {
    const raw = localStorage.getItem(LOCAL_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!isApiConfigured()) {
        setUser(loadLocalUser());
        setLoading(false);
        return;
      }
      const token = tokenStore.get();
      if (!token) { setLoading(false); return; }
      try {
        const me = await api<AuthUser>("/auth/me");
        setUser(me);
      } catch {
        tokenStore.clear();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const signIn: AuthCtx["signIn"] = useCallback(async (email, password) => {
    try {
      if (!isApiConfigured()) {
        const u: AuthUser = { id: `local-${email}`, email, displayName: email.split("@")[0] };
        localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(u));
        setUser(u);
        return { error: null };
      }
      const res = await api<{ token: string; user: AuthUser }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
        auth: false,
      });
      tokenStore.set(res.token);
      setUser(res.user);
      return { error: null };
    } catch (e) {
      return { error: e instanceof ApiError ? e.message : "Sign-in failed" };
    }
  }, []);

  const signUp: AuthCtx["signUp"] = useCallback(async (email, password, displayName) => {
    try {
      if (!isApiConfigured()) {
        const u: AuthUser = { id: `local-${email}`, email, displayName };
        localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(u));
        setUser(u);
        return { error: null };
      }
      const res = await api<{ token: string; user: AuthUser }>("/auth/signup", {
        method: "POST",
        body: JSON.stringify({ email, password, displayName }),
        auth: false,
      });
      tokenStore.set(res.token);
      setUser(res.user);
      return { error: null };
    } catch (e) {
      return { error: e instanceof ApiError ? e.message : "Sign-up failed" };
    }
  }, []);

  const signOut = useCallback(async () => {
    tokenStore.clear();
    localStorage.removeItem(LOCAL_USER_KEY);
    setUser(null);
  }, []);

  return (
    <Ctx.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used inside AuthProvider");
  return v;
}
