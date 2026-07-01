import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAdmin } from "../../server/auth";
import {
  listOrders,
  listImports,
  listLookups,
} from "../../server/orders-service";

/** GET /api/admin/orders → { orders, imports, lookups } (requires admin token). */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!requireAdmin(req)) return res.status(401).json({ error: "Não autorizado." });
  const [orders, imports, lookups] = await Promise.all([
    listOrders(),
    listImports(),
    listLookups(),
  ]);
  return res.status(200).json({ orders, imports, lookups });
}
