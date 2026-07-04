import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAdmin } from "../../server/auth.js";
import { deleteOrders, deleteAllOrders } from "../../server/orders-service.js";

/** POST /api/admin/delete { codigos?: string[], all?: boolean } (admin). */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!requireAdmin(req)) return res.status(401).json({ error: "Não autorizado." });

  const { codigos, all } = (req.body ?? {}) as {
    codigos?: string[];
    all?: boolean;
  };

  if (all) {
    await deleteAllOrders();
    return res.status(200).json({ ok: true, deleted: "all" });
  }
  if (Array.isArray(codigos) && codigos.length) {
    const n = await deleteOrders(codigos.map(String));
    return res.status(200).json({ ok: true, deleted: n });
  }
  return res.status(400).json({ error: "Informe 'codigos' ou 'all'." });
}
