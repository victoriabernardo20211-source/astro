import { sql, desc } from "drizzle-orm";
import { getDb, schema } from "./db.js";
import { parseUa } from "./ua.js";
import type { PresenceRow } from "./schema.js";

const { presence, loginAttempts } = schema;

// online = visto nos últimos 90 segundos

function firstRow(res: unknown): any {
  return (res as any)?.rows?.[0] ?? (res as any)?.[0] ?? res;
}

export interface TouchInput {
  id: string;
  path: string;
  ip: string | null;
  ua: string | null | undefined;
}

/** Registra/atualiza a presença de um visitante e devolve o total online. */
export async function touchPresence(input: TouchInput): Promise<number> {
  const db = await getDb();
  const d = parseUa(input.ua);
  await db
    .insert(presence)
    .values({
      id: input.id,
      path: input.path?.slice(0, 120) ?? "/",
      ip: input.ip,
      device: d.device,
      brand: d.brand,
      os: d.os,
      browser: d.browser,
    })
    .onConflictDoUpdate({
      target: presence.id,
      set: {
        path: input.path?.slice(0, 120) ?? "/",
        ip: input.ip,
        device: d.device,
        brand: d.brand,
        os: d.os,
        browser: d.browser,
        lastSeen: sql`now()`,
      },
    });
  // limpeza de registros antigos
  await db.execute(sql`DELETE FROM presence WHERE last_seen < now() - interval '10 minutes'`);
  return countOnline();
}

export async function countOnline(): Promise<number> {
  const db = await getDb();
  const res = await db.execute(
    sql`SELECT count(*)::int AS c FROM presence WHERE last_seen > now() - interval '90 seconds'`
  );
  return Number(firstRow(res)?.c ?? 0);
}

/** Lista os visitantes online agora (mais recentes primeiro). */
export async function listOnline(): Promise<PresenceRow[]> {
  const db = await getDb();
  return db
    .select()
    .from(presence)
    .where(sql`last_seen > now() - interval '90 seconds'`)
    .orderBy(desc(presence.lastSeen))
    .limit(500);
}

// ---- proteção de força-bruta no login ----

export async function recordLoginAttempt(ip: string | null, ok: boolean): Promise<void> {
  const db = await getDb();
  await db.insert(loginAttempts).values({ ip: ip ?? "?", ok: ok ? 1 : 0 });
  await db.execute(sql`DELETE FROM login_attempts WHERE created_at < now() - interval '1 hour'`);
}

/** True se o IP falhou demais nos últimos 15 min (bloqueia temporariamente). */
export async function isRateLimited(ip: string | null): Promise<boolean> {
  const db = await getDb();
  const res = await db.execute(
    sql`SELECT count(*)::int AS c FROM login_attempts WHERE ok = 0 AND ip = ${ip ?? "?"} AND created_at > now() - interval '15 minutes'`
  );
  return Number(firstRow(res)?.c ?? 0) >= 8;
}
