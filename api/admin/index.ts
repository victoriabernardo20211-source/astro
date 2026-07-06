import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAdmin } from "../../server/auth.js";
import {
  listOrders,
  listImports,
  listLookups,
  importOrders,
  deleteOrders,
  deleteAllOrders,
  sendOrderEmails,
  markOrdersNotified,
  markAcaminhoBaixado,
} from "../../server/orders-service.js";
import { parseLpqvCsv } from "../../server/csv-lpqv.js";
import { isMailConfigured, sendTestEmail } from "../../server/mailer.js";
import { countOnline, listOnline } from "../../server/presence.js";
import { listWebhookEvents } from "../../server/webhook.js";

// mais tempo para o envio de e-mails dos pedidos novos
export const config = { maxDuration: 60 };

/**
 * Único endpoint admin — despacha por "action" no corpo (POST). O plano
 * Hobby da Vercel só permite 12 Serverless Functions por deployment; um
 * arquivo por operação estourava esse limite, então tudo mora aqui agora.
 *
 * POST /api/admin { action, ...campos }, action ∈ "orders" | "presence" |
 * "webhooks" | "import" | "delete" | "send-emails" | "mark-notified" |
 * "mark-acaminho" | "test-email".
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!requireAdmin(req)) return res.status(401).json({ error: "Não autorizado." });

  const body = (req.body ?? {}) as Record<string, unknown>;
  const action = String(body.action ?? "");

  switch (action) {
    case "orders": {
      const [orders, imports, lookups] = await Promise.all([
        listOrders(),
        listImports(),
        listLookups(),
      ]);
      return res.status(200).json({ orders, imports, lookups });
    }

    case "presence": {
      const [online, visitors] = await Promise.all([countOnline(), listOnline()]);
      return res.status(200).json({ online, visitors });
    }

    case "webhooks": {
      const events = await listWebhookEvents();
      return res.status(200).json({ events });
    }

    case "import": {
      const {
        csv,
        mode = "merge",
        name = "planilha.csv",
        sendEmails: sendEmailsFlag = true,
      } = body as { csv?: string; mode?: string; name?: string; sendEmails?: boolean };
      if (!csv || typeof csv !== "string") {
        return res.status(400).json({ error: "Conteúdo CSV ausente." });
      }
      const { orders, errors } = parseLpqvCsv(csv);
      if (orders.length === 0) {
        return res.status(422).json({ error: "Nenhum pedido válido.", errors });
      }
      const result = await importOrders(orders, mode === "replace" ? "replace" : "merge", String(name));

      let emailed = 0;
      let emailSkipped = 0;
      if (sendEmailsFlag && isMailConfigured()) {
        const r = await sendOrderEmails(result.addedRows.map((o) => o.codigo));
        emailed = r.sent;
        emailSkipped = r.skipped;
      }
      return res.status(200).json({
        count: result.count,
        added: result.added,
        emailed,
        emailSkipped,
        mailConfigured: isMailConfigured(),
        autoEmail: sendEmailsFlag,
        errors,
      });
    }

    case "delete": {
      const { codigos, all } = body as { codigos?: string[]; all?: boolean };
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

    case "send-emails": {
      if (!isMailConfigured()) {
        return res
          .status(400)
          .json({ error: "SMTP não configurado. Defina as variáveis SMTP_* no Vercel." });
      }
      const { codigos } = body as { codigos?: string[] };
      if (!Array.isArray(codigos) || codigos.length === 0) {
        return res.status(400).json({ error: "Selecione ao menos um pedido." });
      }
      const result = await sendOrderEmails(codigos.map(String));
      return res.status(200).json(result);
    }

    case "mark-notified": {
      const { codigos } = body as { codigos?: string[] };
      if (!Array.isArray(codigos) || codigos.length === 0) {
        return res.status(400).json({ error: "Informe 'codigos'." });
      }
      const marked = await markOrdersNotified(codigos.map(String));
      return res.status(200).json({ ok: true, marked });
    }

    case "mark-acaminho": {
      const { codigos } = body as { codigos?: string[] };
      if (!Array.isArray(codigos) || codigos.length === 0) {
        return res.status(400).json({ error: "Informe 'codigos'." });
      }
      const marked = await markAcaminhoBaixado(codigos.map(String));
      return res.status(200).json({ ok: true, marked });
    }

    case "test-email": {
      if (!isMailConfigured()) {
        return res
          .status(400)
          .json({ error: "SMTP não configurado. Defina as variáveis SMTP_* no Vercel." });
      }
      const { to } = body as { to?: string };
      if (!to) return res.status(400).json({ error: "Informe um e-mail." });
      try {
        await sendTestEmail(String(to));
        return res.status(200).json({ ok: true });
      } catch (e) {
        return res.status(500).json({ error: e instanceof Error ? e.message : "Falha ao enviar." });
      }
    }

    default:
      return res.status(400).json({ error: `Ação desconhecida: ${action}` });
  }
}
