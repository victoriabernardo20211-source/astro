import type { Order, ImportRecord, Lookup, Presence, WebhookEvent } from "./types";

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

/**
 * Único endpoint admin (server/api/admin/index.ts) — despacha por "action"
 * no corpo. Um arquivo por operação estourava o limite de 12 Serverless
 * Functions do plano Hobby da Vercel, então tudo passa por aqui agora.
 */
async function adminPost(
  action: string,
  body: Record<string, unknown> = {}
): Promise<{ res: Response; data: any }> {
  const res = await fetch("/api/admin", {
    method: "POST",
    headers: { "content-type": "application/json", ...authHeaders() },
    body: JSON.stringify({ action, ...body }),
  });
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

export interface AdminData {
  orders: Order[];
  imports: ImportRecord[];
  lookups: Lookup[];
}

export async function fetchAdminData(): Promise<AdminData> {
  const { res, data } = await adminPost("orders");
  if (res.status === 401) throw new Error("unauthorized");
  if (!res.ok) throw new Error("Falha ao carregar os pedidos.");
  return data as AdminData;
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
  const { res, data } = await adminPost("import", { csv, mode, name, sendEmails });
  if (!res.ok) {
    const msg = data?.errors?.length
      ? data.errors.join(" ")
      : data?.error ?? "Falha ao importar.";
    throw new Error(msg);
  }
  return data as ImportResult;
}

export async function deleteOrders(codigos: string[]): Promise<void> {
  const { res } = await adminPost("delete", { codigos });
  if (!res.ok) throw new Error("Falha ao apagar os pedidos.");
}

export interface SendEmailsResult {
  sent: number;
  already: number;
  noEmail: number;
  naoPago?: number;
  failed: number;
  skipped: number;
  mailConfigured: boolean;
}

export async function sendOrderEmails(codigos: string[]): Promise<SendEmailsResult> {
  const { res, data } = await adminPost("send-emails", { codigos });
  if (!res.ok) throw new Error(data?.error ?? "Falha ao enviar e-mails.");
  return data as SendEmailsResult;
}

/** Marca pedidos como notificados sem enviar e-mail (ex.: após exportar iOS/Android). */
export async function markNotified(codigos: string[]): Promise<{ marked: number }> {
  const { res, data } = await adminPost("mark-notified", { codigos });
  if (!res.ok) throw new Error(data?.error ?? "Falha ao marcar como notificado.");
  return data as { marked: number };
}

/** Marca pedidos (já notificados) como baixados na 2ª lista ("a caminho"). */
export async function markAcaminhoBaixado(codigos: string[]): Promise<{ marked: number }> {
  const { res, data } = await adminPost("mark-acaminho", { codigos });
  if (!res.ok) throw new Error(data?.error ?? "Falha ao marcar como baixado.");
  return data as { marked: number };
}

export interface PresenceData {
  online: number;
  visitors: Presence[];
}

export async function fetchPresence(): Promise<PresenceData> {
  const { res, data } = await adminPost("presence");
  if (!res.ok) throw new Error("Falha ao carregar presença.");
  return data as PresenceData;
}

export async function fetchWebhooks(): Promise<{ events: WebhookEvent[] }> {
  const { res, data } = await adminPost("webhooks");
  if (!res.ok) throw new Error("Falha ao carregar webhooks.");
  return data as { events: WebhookEvent[] };
}

export async function sendTestEmail(to: string): Promise<void> {
  const { res, data } = await adminPost("test-email", { to });
  if (!res.ok) throw new Error(data?.error ?? "Falha ao enviar o e-mail de teste.");
}

export async function deleteAllOrders(): Promise<void> {
  const { res } = await adminPost("delete", { all: true });
  if (!res.ok) throw new Error("Falha ao apagar os pedidos.");
}
