import type { VercelRequest, VercelResponse } from "@vercel/node";
import { trackOrder, recordLookup } from "../server/orders-service.js";
import { parseUa } from "../server/ua.js";

function clientIp(req: VercelRequest): string | null {
  const fwd = req.headers["x-forwarded-for"];
  const raw = Array.isArray(fwd) ? fwd[0] : fwd;
  return raw ? raw.split(",")[0].trim() : req.socket?.remoteAddress ?? null;
}

/** Public: GET /api/track?q=<código ou CPF> — also logs the device that looked up. */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const q = String(req.query.q ?? "").trim();
  if (!q) return res.status(400).json({ error: "Informe um código ou CPF." });

  const order = await trackOrder(q);

  // Capture the device that performed this lookup (fire-and-forget).
  const ua = req.headers["user-agent"];
  const info = parseUa(Array.isArray(ua) ? ua[0] : ua);
  try {
    await recordLookup({
      codigo: order?.codigo ?? null,
      query: q,
      cliente: order?.cliente ?? null,
      found: !!order,
      device: info.device,
      brand: info.brand,
      os: info.os,
      browser: info.browser,
      ip: clientIp(req),
      userAgent: Array.isArray(ua) ? ua[0] : ua ?? null,
    });
  } catch {
    /* logging must never break tracking */
  }

  if (!order) return res.status(404).json({ error: "Pedido não encontrado." });
  return res.status(200).json({ order });
}
