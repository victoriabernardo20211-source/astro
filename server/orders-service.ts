import { or, sql, desc, inArray } from "drizzle-orm";
import { getDb, schema } from "./db.js";
import type { NewOrderRow, OrderRow, ImportRow, LookupRow } from "./schema.js";

const { orders, imports, lookups } = schema;

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/** Public lookup by tracking code, order number, or CPF. */
export async function trackOrder(q: string): Promise<OrderRow | null> {
  const db = await getDb();
  const digits = q.replace(/\D/g, "");
  const rows = await db
    .select()
    .from(orders)
    .where(
      or(
        sql`lower(${orders.codigo}) = lower(${q})`,
        sql`lower(coalesce(${orders.pedidoRef}, '')) = lower(${q})`,
        digits.length >= 11
          ? sql`regexp_replace(coalesce(${orders.cpf}, ''), '[^0-9]', '', 'g') = ${digits}`
          : sql`false`
      )
    )
    .limit(1);
  return rows[0] ?? null;
}

/** All orders, newest first (admin). */
export async function listOrders(): Promise<OrderRow[]> {
  const db = await getDb();
  return db.select().from(orders).orderBy(desc(orders.createdAt)).limit(5000);
}

/** Import history, newest first (admin). */
export async function listImports(): Promise<ImportRow[]> {
  const db = await getDb();
  return db.select().from(imports).orderBy(desc(imports.createdAt)).limit(50);
}

/** Recent tracking lookups, newest first (admin). */
export async function listLookups(): Promise<LookupRow[]> {
  const db = await getDb();
  return db.select().from(lookups).orderBy(desc(lookups.createdAt)).limit(500);
}

export interface LookupInput {
  codigo: string | null;
  query: string;
  cliente: string | null;
  found: boolean;
  device: string;
  brand: string;
  os: string;
  browser: string;
  ip: string | null;
  userAgent: string | null;
}

/** Logs one public tracking lookup (the device that consulted a code). */
export async function recordLookup(entry: LookupInput): Promise<void> {
  const db = await getDb();
  await db.insert(lookups).values({
    codigo: entry.codigo,
    query: entry.query.slice(0, 120),
    cliente: entry.cliente,
    found: entry.found ? 1 : 0,
    device: entry.device,
    brand: entry.brand,
    os: entry.os,
    browser: entry.browser,
    ip: entry.ip,
    userAgent: entry.userAgent?.slice(0, 400) ?? null,
  });
}

export interface ImportOutcome {
  count: number;
  added: number;
  /** Pedidos realmente novos nesta importação (para notificar por e-mail). */
  addedRows: NewOrderRow[];
}

/** Upserts parsed rows. "replace" wipes the table first; "merge" overwrites by code. */
export async function importOrders(
  rows: NewOrderRow[],
  mode: "merge" | "replace",
  name: string
): Promise<ImportOutcome> {
  const db = await getDb();
  const codes = [...new Set(rows.map((r) => r.codigo))];
  const cpfs = [...new Set(rows.map((r) => r.cpf).filter(Boolean))] as string[];

  // pedidos já existentes, por código e por CPF (para não duplicar o mesmo CPF)
  const existingRows = await db
    .select({ c: orders.codigo, p: orders.cpf })
    .from(orders);
  const existCodes = new Set(existingRows.map((r) => r.c));
  const existCpfs = new Set(existingRows.map((r) => r.p).filter(Boolean));
  // novos = os que ainda não existiam (por código ou CPF), mesmo no modo replace
  const addedRows = rows.filter(
    (r) => !(existCodes.has(r.codigo) || (r.cpf && existCpfs.has(r.cpf)))
  );
  const added = addedRows.length;

  if (mode === "replace") {
    await db.delete(orders);
  } else {
    // remove os que serão reinseridos — por código E por CPF (junta em um)
    if (codes.length) await db.delete(orders).where(inArray(orders.codigo, codes));
    if (cpfs.length) await db.delete(orders).where(inArray(orders.cpf, cpfs));
  }

  for (const part of chunk(rows, 200)) {
    await db.insert(orders).values(part);
  }

  await db.insert(imports).values({ name, count: rows.length, added, mode });
  return { count: rows.length, added, addedRows };
}

/** Apaga os pedidos com os códigos informados. Retorna quantos foram pedidos. */
export async function deleteOrders(codigos: string[]): Promise<number> {
  if (!codigos.length) return 0;
  const db = await getDb();
  await db.delete(orders).where(inArray(orders.codigo, codigos));
  return codigos.length;
}

/** Apaga TODOS os pedidos (mantém histórico de imports e acessos). */
export async function deleteAllOrders(): Promise<void> {
  const db = await getDb();
  await db.delete(orders);
}
