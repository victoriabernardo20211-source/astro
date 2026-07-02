import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAdmin } from "../../server/auth.js";
import { isMailConfigured, sendTestEmail } from "../../server/mailer.js";

/** POST /api/admin/test-email { to } → envia um e-mail de teste (admin). */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!requireAdmin(req)) return res.status(401).json({ error: "Não autorizado." });
  if (!isMailConfigured()) {
    return res.status(400).json({ error: "SMTP não configurado. Defina as variáveis SMTP_* no Vercel." });
  }
  const { to } = (req.body ?? {}) as { to?: string };
  if (!to) return res.status(400).json({ error: "Informe um e-mail." });
  try {
    await sendTestEmail(String(to));
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e instanceof Error ? e.message : "Falha ao enviar." });
  }
}
