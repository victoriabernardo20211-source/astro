/**
 * Minimal admin auth for the import panel. Credentials e token vêm de
 * variáveis de ambiente. Em produção (Vercel), se ADMIN_USER/ADMIN_PASSWORD
 * não forem definidos, o login fica DESATIVADO (nunca cai num usuário/senha
 * padrão público) — o único fallback "berlim/123456" é para rodar local
 * (npm run dev), quando não há POSTGRES_URL nem VERCEL setados.
 */
const isProd = !!process.env.VERCEL || !!process.env.POSTGRES_URL;
const ADMIN_USER = process.env.ADMIN_USER || (isProd ? "" : "berlim");
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || (isProd ? "" : "123456");

/** The bearer token handed out on login and required by admin endpoints. */
export const ADMIN_TOKEN =
  process.env.ADMIN_TOKEN || (ADMIN_PASSWORD ? `astro-${ADMIN_PASSWORD}` : "");

export function verifyLogin(user: unknown, password: unknown): boolean {
  if (!ADMIN_USER || !ADMIN_PASSWORD) return false; // não configurado: ninguém entra
  return (
    typeof user === "string" &&
    typeof password === "string" &&
    user.trim().toLowerCase() === ADMIN_USER &&
    password === ADMIN_PASSWORD
  );
}

/** True when the request carries a valid admin bearer token. */
export function requireAdmin(req: { headers: Record<string, unknown> }): boolean {
  const raw = req.headers["authorization"] ?? req.headers["Authorization"];
  const header = Array.isArray(raw) ? raw[0] : raw;
  if (typeof header !== "string") return false;
  const token = header.replace(/^Bearer\s+/i, "").trim();
  return token.length > 0 && token === ADMIN_TOKEN;
}
