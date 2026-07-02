import type { VercelRequest, VercelResponse } from "@vercel/node";
import { touchPresence } from "../server/presence.js";

function clientIp(req: VercelRequest): string | null {
  const fwd = req.headers["x-forwarded-for"];
  const raw = Array.isArray(fwd) ? fwd[0] : fwd;
  return raw ? raw.split(",")[0].trim() : req.socket?.remoteAddress ?? null;
}

/** POST /api/presence { id, path } — heartbeat público. Retorna { online }. */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { id, path } = (req.body ?? {}) as { id?: string; path?: string };
  if (!id) return res.status(400).json({ error: "id ausente" });
  const ua = req.headers["user-agent"];
  try {
    const online = await touchPresence({
      id: String(id).slice(0, 60),
      path: String(path ?? "/"),
      ip: clientIp(req),
      ua: Array.isArray(ua) ? ua[0] : ua,
    });
    return res.status(200).json({ online });
  } catch {
    return res.status(200).json({ online: 0 });
  }
}
