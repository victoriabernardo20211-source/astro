/**
 * Minimal admin auth for the import panel. Credentials and token come from
 * environment variables in production; the defaults keep local dev working.
 */
const ADMIN_USER = process.env.ADMIN_USER || "berlim";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "123456";

/** The bearer token handed out on login and required by admin endpoints. */
export const ADMIN_TOKEN =
  process.env.ADMIN_TOKEN || `astro-${ADMIN_PASSWORD}`;

export function verifyLogin(user: unknown, password: unknown): boolean {
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
