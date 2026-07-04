import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAdmin } from "../../server/auth.js";
import { countOnline, listOnline } from "../../server/presence.js";

/** GET /api/admin/presence → { online, visitors } (admin). */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!requireAdmin(req)) return res.status(401).json({ error: "Não autorizado." });
  const [online, visitors] = await Promise.all([countOnline(), listOnline()]);
  return res.status(200).json({ online, visitors });
}
