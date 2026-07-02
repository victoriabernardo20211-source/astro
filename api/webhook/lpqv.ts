import type { VercelRequest, VercelResponse } from "@vercel/node";
import { parseWebhookOrder, recordWebhookEvent } from "../../server/webhook.js";
import { importOrders, sendOrderEmails } from "../../server/orders-service.js";
import { isMailConfigured } from "../../server/mailer.js";

export const config = { maxDuration: 30 };

const SECRET = (process.env.WEBHOOK_SECRET || "").trim();
const AUTO_EMAIL = (process.env.WEBHOOK_SEND_EMAIL || "0") === "1";

/**
 * POST /api/webhook/lpqv?key=SECRET — recebe os pedidos da LPQV em tempo real.
 * Grava o pedido no banco e guarda o payload bruto para depuração.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // segurança: chave secreta na URL (?key=) ou no header x-webhook-key
  const key =
    (typeof req.query.key === "string" ? req.query.key : "") ||
    (req.headers["x-webhook-key"] as string) ||
    "";
  if (!SECRET || key !== SECRET) {
    return res.status(401).json({ error: "unauthorized" });
  }
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const payload = req.body ?? {};
  const raw = (() => {
    try {
      return typeof payload === "string" ? payload : JSON.stringify(payload);
    } catch {
      return "";
    }
  })();

  let order = null;
  try {
    order = parseWebhookOrder(payload);
  } catch {
    order = null;
  }

  try {
    if (order) {
      const result = await importOrders([order], "merge", "webhook", false);
      if (AUTO_EMAIL && isMailConfigured() && result.addedRows.length) {
        await sendOrderEmails(result.addedRows.map((o) => o.codigo)).catch(() => {});
      }
      await recordWebhookEvent({
        method: "pedidos",
        codigo: order.codigo,
        cliente: order.cliente ?? null,
        ok: true,
        message: result.added ? "pedido novo" : "pedido atualizado",
        raw,
      });
    } else {
      await recordWebhookEvent({
        method: "pedidos",
        codigo: null,
        cliente: null,
        ok: false,
        message: "não consegui mapear o pedido a partir do payload",
        raw,
      });
    }
  } catch (e) {
    // sempre responde 200 pra LPQV não ficar reenviando; registra o erro
    try {
      await recordWebhookEvent({
        method: "pedidos",
        codigo: order?.codigo ?? null,
        cliente: order?.cliente ?? null,
        ok: false,
        message: e instanceof Error ? e.message : "erro ao processar",
        raw,
      });
    } catch {
      /* ignore */
    }
  }

  return res.status(200).json({ ok: true });
}
