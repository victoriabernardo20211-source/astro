import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAdmin } from "../../server/auth.js";
import { markAcaminhoBaixado } from "../../server/orders-service.js";

/**
 * POST /api/admin/mark-acaminho { codigos: string[] } (admin).
 * Marca pedidos já notificados como baixados na 2ª lista ("a caminho"),
 * pra não aparecerem de novo no próximo "Baixar todos ... a caminho".
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!requireAdmin(req)) return res.status(401).json({ error: "Não autorizado." });

  const { codigos } = (req.body ?? {}) as { codigos?: string[] };
  if (!Array.isArray(codigos) || codigos.length === 0) {
    return res.status(400).json({ error: "Informe 'codigos'." });
  }
  const marked = await markAcaminhoBaixado(codigos.map(String));
  return res.status(200).json({ ok: true, marked });
}
