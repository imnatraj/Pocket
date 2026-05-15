// REST API client for the standalone Node.js + Express + MySQL backend.
// Configure with VITE_API_URL (e.g. http://localhost:4000/api).
// If unreachable, callers can fall back to localStorage so the UI stays usable.

export const API_URL = (() => {
  const url = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? "";
  // If the URL is set but doesn't end with /api, append it.
  // This matches the backend's app.use('/api', ...) structure.
  if (url && !url.toLowerCase().endsWith("/api")) {
    return `${url}/api`;
  }
  return url;
})();

const TOKEN_KEY = "pocket.jwt";

export const tokenStore = {
  get: () => (typeof localStorage !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function api<T = unknown>(
  path: string,
  init: RequestInit & { auth?: boolean } = {}
): Promise<T> {
  if (!API_URL) throw new ApiError(0, "API not configured");
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body) headers.set("Content-Type", "application/json");
  const token = tokenStore.get();
  if (token && init.auth !== false) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  const text = await res.text();
  const data = text ? (() => { try { return JSON.parse(text); } catch { return text; } })() : null;
  if (!res.ok) {
    const msg = (data && typeof data === "object" && (data as any).message) || res.statusText;
    throw new ApiError(res.status, msg);
  }
  return data as T;
}

export const isApiConfigured = () => !!API_URL;
