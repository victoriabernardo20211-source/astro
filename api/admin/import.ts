import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAdmin } from "../../server/auth.js";
import { parseLpqvCsv } from "../../server/csv-lpqv.js";
import { importOrders } from "../../server/orders-service.js";
import { isMailConfigured, sendPostadoBatch } from "../../server/mailer.js";

// mais tempo para o envio de e-mails dos pedidos novos
export const config = { maxDuration: 60 };

/** POST /api/admin/import { csv, mode, name } → { count, added, emailed, errors }. */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!requireAdmin(req)) return res.status(401).json({ error: "Não autorizado." });

  const { csv, mode = "merge", name = "planilha.csv" } = (req.body ?? {}) as {
    csv?: string;
    mode?: string;
    name?: string;
  };
  if (!csv || typeof csv !== "string") {
    return res.status(400).json({ error: "Conteúdo CSV ausente." });
  }

  const { orders, errors } = parseLpqvCsv(csv);
  if (orders.length === 0) {
    return res.status(422).json({ error: "Nenhum pedido válido.", errors });
  }

  const result = await importOrders(
    orders,
    mode === "replace" ? "replace" : "merge",
    String(name)
  );

  // e-mail de "pedido postado" só para os pedidos NOVOS desta importação
  let emailed = 0;
  let emailSkipped = 0;
  if (isMailConfigured()) {
    const r = await sendPostadoBatch(result.addedRows);
    emailed = r.sent;
    emailSkipped = r.skipped;
  }

  return res.status(200).json({
    count: result.count,
    added: result.added,
    emailed,
    emailSkipped,
    mailConfigured: isMailConfigured(),
    errors,
  });
}
