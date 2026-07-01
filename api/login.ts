import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyLogin, ADMIN_TOKEN } from "../server/auth";

/** POST /api/login { user, password } → { token } */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { user, password } = (req.body ?? {}) as Record<string, unknown>;
  if (verifyLogin(user, password)) {
    return res.status(200).json({ token: ADMIN_TOKEN, user });
  }
  return res.status(401).json({ error: "Usuário ou senha inválidos." });
}
