import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyLogin, ADMIN_TOKEN } from "../server/auth.js";
import { isRateLimited, recordLoginAttempt } from "../server/presence.js";

function clientIp(req: VercelRequest): string | null {
  const fwd = req.headers["x-forwarded-for"];
  const raw = Array.isArray(fwd) ? fwd[0] : fwd;
  return raw ? raw.split(",")[0].trim() : req.socket?.remoteAddress ?? null;
}

/** POST /api/login { user, password } → { token }. Bloqueia força-bruta por IP. */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const ip = clientIp(req);

  try {
    if (await isRateLimited(ip)) {
      return res
        .status(429)
        .json({ error: "Muitas tentativas. Tente novamente em alguns minutos." });
    }
  } catch {
    /* se o banco falhar, não bloqueia o login */
  }

  const { user, password } = (req.body ?? {}) as Record<string, unknown>;
  const ok = verifyLogin(user, password);
  try {
    await recordLoginAttempt(ip, ok);
  } catch {
    /* ignore */
  }

  if (ok) return res.status(200).json({ token: ADMIN_TOKEN, user });
  return res.status(401).json({ error: "Usuário ou senha inválidos." });
}
