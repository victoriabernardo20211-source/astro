import { sql } from "drizzle-orm";
import * as schema from "./schema";

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
}

/** A few demo orders so tracking works before the first real import. */
const DEMO: schema.NewOrderRow[] = [
  {
    codigo: "AF-2847193-BR",
    cpf: "304.118.756-09",
    cliente: "Mariana Castro",
    status: "Em rota",
    cidade: "Salvador",
    uf: "BA",
    origem: "São Paulo / SP",
    produto: "Pedido demonstração",
    data: "15 jun 2026",
    previsao: "Hoje, até 18h",
  },
  {
    codigo: "AF-2846783-BR",
    cpf: "203.776.998-50",
    cliente: "Lucas Pereira",
    status: "Entregue",
    cidade: "Belo Horizonte",
    uf: "MG",
    origem: "São Paulo / SP",
    produto: "Pedido demonstração",
    data: "13 jun 2026",
    previsao: "Entregue",
  },
  {
    codigo: "AF-2847055-BR",
    cpf: "512.903.447-21",
    cliente: "Rafael Nogueira",
    status: "Em trânsito",
    cidade: "Curitiba",
    uf: "PR",
    origem: "São Paulo / SP",
    produto: "Pedido demonstração",
    data: "14 jun 2026",
    previsao: "16 jun, até 18h",
  },
];

/** Inserts the demo orders, skipping any code that already exists. */
export async function seedDemo(db: DB) {
  await db.insert(schema.orders).values(DEMO).onConflictDoNothing();
}

/** Memoized, schema-ensured database handle (seeded on first creation). */
export async function getDb(): Promise<DB> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await create();
      await ensureSchema(db);
      await seedDemo(db);
      return db;
    })();
  }
  return dbPromise;
}

export { schema };
