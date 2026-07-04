import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAdmin } from "../../server/auth.js";
import { sendOrderEmails } from "../../server/orders-service.js";
import { isMailConfigured } from "../../server/mailer.js";

export const config = { maxDuration: 60 };

/** POST /api/admin/send-emails { codigos: string[] } (admin). Nunca reenvia. */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!requireAdmin(req)) return res.status(401).json({ error: "Não autorizado." });
  if (!isMailConfigured()) {
    return res.status(400).json({ error: "SMTP não configurado. Defina as variáveis SMTP_* no Vercel." });
  }
  const { codigos } = (req.body ?? {}) as { codigos?: string[] };
  if (!Array.isArray(codigos) || codigos.length === 0) {
    return res.status(400).json({ error: "Selecione ao menos um pedido." });
  }
  const result = await sendOrderEmails(codigos.map(String));
  return res.status(200).json(result);
}
