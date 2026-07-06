import { sql } from "drizzle-orm";
import * as schema from "./schema.js";

/**
 * Returns a Drizzle client. Uses Vercel Postgres (or any Postgres) when a
 * connection string is present, otherwise a local PGlite database (Postgres in
 * WASM, persisted to .data/) so `npm run dev` works with zero setup.
 */
type DB = Awaited<ReturnType<typeof create>>;

const CONNECTION =
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  "";

let dbPromise: Promise<DB> | null = null;

async function create() {
  if (CONNECTION) {
    const [{ drizzle }, postgres] = await Promise.all([
      import("drizzle-orm/postgres-js"),
      import("postgres").then((m) => m.default),
    ]);
    // prepare:false keeps it compatible with pooled (pgbouncer) connections.
    const client = postgres(CONNECTION, { prepare: false, max: 1 });
    return drizzle(client, { schema });
  }
  const [{ drizzle }, { PGlite }, { mkdirSync }] = await Promise.all([
    import("drizzle-orm/pglite"),
    import("@electric-sql/pglite"),
    import("node:fs"),
  ]);
  const dir = ".data/pglite";
  mkdirSync(dir, { recursive: true }); // PGlite's own mkdir isn't recursive
  const client = new PGlite(dir);
  return drizzle(client, { schema });
}

async function ensureSchema(db: DB) {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS orders (
      codigo text PRIMARY KEY,
      pedido_ref text,
      cpf text,
      cliente text NOT NULL,
      email text,
      telefone text,
      status text NOT NULL,
      status_envio text,
      status_pagamento text,
      cidade text,
      uf text,
      cep text,
      endereco text,
      numero text,
      complemento text,
      bairro text,
      produto text,
      produto_sku text,
      produto_foto text,
      qtde integer DEFAULT 1,
      tipo_frete text,
      valor_frete text,
      valor_total text,
      meio_pagamento text,
      codigo_rastreio text,
      origem text,
      data text,
      data_pedido text,
      previsao text,
      created_at timestamp DEFAULT now(),
      updated_at timestamp DEFAULT now()
    );
  `);
  // ensure new columns exist on databases created by earlier versions
  await db.execute(sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS data_pedido text;`);
  await db.execute(sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS transportadora text;`);
  await db.execute(sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS email_enviado_em text;`);
  await db.execute(sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS dispositivo text;`);
  await db.execute(sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS dispositivo_marca text;`);
  await db.execute(sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS dispositivo_os text;`);
  await db.execute(sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS plataforma text;`);
  await db.execute(sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS acaminho_baixado_em text;`);
  // limpa "LPQV" de pedidos gravados antes de tirarmos isso do texto padrão
  await db.execute(sql`
    UPDATE orders
    SET origem = trim(regexp_replace(regexp_replace(origem, 'lpqv', '', 'gi'), '\s{2,}', ' ', 'g'))
    WHERE origem ILIKE '%lpqv%';
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS imports (
      id serial PRIMARY KEY,
      name text NOT NULL,
      count integer NOT NULL,
      added integer NOT NULL,
      mode text NOT NULL,
      created_at timestamp DEFAULT now()
    );
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS lookups (
      id serial PRIMARY KEY,
      codigo text,
      query text,
      cliente text,
      found integer DEFAULT 1,
      device text,
      brand text,
      os text,
      browser text,
      ip text,
      user_agent text,
      created_at timestamp DEFAULT now()
    );
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS presence (
      id text PRIMARY KEY,
      path text,
      ip text,
      device text,
      brand text,
      os text,
      browser text,
      first_seen timestamp DEFAULT now(),
      last_seen timestamp DEFAULT now()
    );
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS login_attempts (
      id serial PRIMARY KEY,
      ip text,
      ok integer DEFAULT 0,
      created_at timestamp DEFAULT now()
    );
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS webhook_events (
      id serial PRIMARY KEY,
      method text,
      codigo text,
      cliente text,
      ok integer DEFAULT 1,
      message text,
      raw text,
      created_at timestamp DEFAULT now()
    );
  `);
}

/** Memoized, schema-ensured database handle. */
export async function getDb(): Promise<DB> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await create();
      await ensureSchema(db);
      return db;
    })();
  }
  return dbPromise;
}

export { schema };
