import { or, sql, desc, inArray } from "drizzle-orm";
import { getDb, schema, seedDemo } from "./db";
import type { NewOrderRow, OrderRow, ImportRow, LookupRow } from "./schema";

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
}

/** Upserts parsed rows. "replace" wipes the table first; "merge" overwrites by code. */
export async function importOrders(
  rows: NewOrderRow[],
  mode: "merge" | "replace",
  name: string
): Promise<ImportOutcome> {
  const db = await getDb();
  const codes = [...new Set(rows.map((r) => r.codigo))];

  const existing = new Set(
    (await db.select({ c: orders.codigo }).from(orders)).map((r) => r.c)
  );
  const added =
    mode === "replace"
      ? rows.length
      : rows.filter((r) => !existing.has(r.codigo)).length;

  if (mode === "replace") {
    await db.delete(orders);
  } else if (codes.length) {
    await db.delete(orders).where(inArray(orders.codigo, codes));
  }

  for (const part of chunk(rows, 200)) {
    await db.insert(orders).values(part);
  }

  await db.insert(imports).values({ name, count: rows.length, added, mode });
  return { count: rows.length, added };
}

/** Wipes all data and restores the bundled demo orders. */
export async function resetToDemo(): Promise<void> {
  const db = await getDb();
  await db.delete(orders);
  await db.delete(imports);
  await db.delete(lookups);
  await seedDemo(db);
}
