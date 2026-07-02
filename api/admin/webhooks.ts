import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAdmin } from "../../server/auth.js";
import { listWebhookEvents } from "../../server/webhook.js";

/** GET /api/admin/webhooks → { events } (admin). */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!requireAdmin(req)) return res.status(401).json({ error: "Não autorizado." });
  const events = await listWebhookEvents();
  return res.status(200).json({ events });
}
