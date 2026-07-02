import type { Order, ImportRecord, Lookup } from "./types";

const TOKEN_KEY = "astro-fretes:token";

export function getToken(): string {
  try {
    return localStorage.getItem(TOKEN_KEY) ?? "";
  } catch {
    return "";
  }
}

function setToken(token: string) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* ignore */
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

export function isAuthenticated(): boolean {
  return getToken().length > 0;
}

/** Public tracking lookup. Returns null when nothing matches. */
export async function trackOrder(q: string): Promise<Order | null> {
  const res = await fetch(`/api/track?q=${encodeURIComponent(q)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Falha ao consultar o rastreio.");
  const data = await res.json();
  return data.order as Order;
}

/** Admin login — stores the token on success. */
export async function adminLogin(user: string, password: string): Promise<boolean> {
  const res = await fetch("/api/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ user, password }),
  });
  if (!res.ok) return false;
  const { token } = await res.json();
  if (!token) return false;
  setToken(token);
  return true;
}

function authHeaders(): Record<string, string> {
  return { authorization: `Bearer ${getToken()}` };
}

export interface AdminData {
  orders: Order[];
  imports: ImportRecord[];
  lookups: Lookup[];
}

export async function fetchAdminData(): Promise<AdminData> {
  const res = await fetch("/api/admin/orders", { headers: authHeaders() });
  if (res.status === 401) throw new Error("unauthorized");
  if (!res.ok) throw new Error("Falha ao carregar os pedidos.");
  return res.json();
}

export interface ImportResult {
  count: number;
  added: number;
  errors: string[];
  emailed?: number;
  emailSkipped?: number;
  mailConfigured?: boolean;
}

export async function importCsv(
  csv: string,
  mode: "merge" | "replace",
  name: string,
  sendEmails: boolean
): Promise<ImportResult> {
  const res = await fetch("/api/admin/import", {
    method: "POST",
    headers: { "content-type": "application/json", ...authHeaders() },
    body: JSON.stringify({ csv, mode, name, sendEmails }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.errors?.length
      ? data.errors.join(" ")
      : data?.error ?? "Falha ao importar.";
    throw new Error(msg);
  }
  return data as ImportResult;
}

export async function deleteOrders(codigos: string[]): Promise<void> {
  const res = await fetch("/api/admin/delete", {
    method: "POST",
    headers: { "content-type": "application/json", ...authHeaders() },
    body: JSON.stringify({ codigos }),
  });
  if (!res.ok) throw new Error("Falha ao apagar os pedidos.");
}

export interface SendEmailsResult {
  sent: number;
  already: number;
  noEmail: number;
  failed: number;
  skipped: number;
  mailConfigured: boolean;
}

export async function sendOrderEmails(
  codigos: string[],
  force = false
): Promise<SendEmailsResult> {
  const res = await fetch("/api/admin/send-emails", {
    method: "POST",
    headers: { "content-type": "application/json", ...authHeaders() },
    body: JSON.stringify({ codigos, force }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error ?? "Falha ao enviar e-mails.");
  return data as SendEmailsResult;
}

export async function sendTestEmail(to: string): Promise<void> {
  const res = await fetch("/api/admin/test-email", {
    method: "POST",
    headers: { "content-type": "application/json", ...authHeaders() },
    body: JSON.stringify({ to }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error ?? "Falha ao enviar o e-mail de teste.");
}

export async function deleteAllOrders(): Promise<void> {
  const res = await fetch("/api/admin/delete", {
    method: "POST",
    headers: { "content-type": "application/json", ...authHeaders() },
    body: JSON.stringify({ all: true }),
  });
  if (!res.ok) throw new Error("Falha ao apagar os pedidos.");
}
