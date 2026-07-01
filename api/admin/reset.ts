import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAdmin } from "../../server/auth";
import { resetToDemo } from "../../server/orders-service";

/** POST /api/admin/reset → wipes data and restores demo orders. */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!requireAdmin(req)) return res.status(401).json({ error: "Não autorizado." });
  await resetToDemo();
  return res.status(200).json({ ok: true });
}
