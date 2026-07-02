import {
  pgTable,
  text,
  integer,
  timestamp,
  serial,
} from "drizzle-orm/pg-core";

/**
 * One shipment / order. `codigo` is the public tracking code (the carrier code
 * when available, otherwise the store order number) and is unique.
 */
export const orders = pgTable("orders", {
  codigo: text("codigo").primaryKey(),
  pedidoRef: text("pedido_ref"), // store order number (Cód)
  cpf: text("cpf"),
  cliente: text("cliente").notNull(),
  email: text("email"),
  telefone: text("telefone"),
  // canonical status label (drives the timeline)
  status: text("status").notNull(),
  statusEnvio: text("status_envio"), // raw shipping status from the export
  statusPagamento: text("status_pagamento"), // raw payment status
  // destination address
  cidade: text("cidade"),
  uf: text("uf"),
  cep: text("cep"),
  endereco: text("endereco"),
  numero: text("numero"),
  complemento: text("complemento"),
  bairro: text("bairro"),
  // product
  produto: text("produto"),
  produtoSku: text("produto_sku"),
  produtoFoto: text("produto_foto"),
  qtde: integer("qtde").default(1),
  // logistics / payment
  tipoFrete: text("tipo_frete"),
  valorFrete: text("valor_frete"),
  valorTotal: text("valor_total"),
  meioPagamento: text("meio_pagamento"),
  codigoRastreio: text("codigo_rastreio"),
  transportadora: text("transportadora"),
  origem: text("origem"),
  data: text("data"), // order date as shown (display)
  dataPedido: text("data_pedido"), // ISO date (YYYY-MM-DD) for estimated timeline
  previsao: text("previsao"),
  emailEnviadoEm: text("email_enviado_em"), // ISO datetime quando o e-mail foi enviado (null = não enviado)
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

/** One CSV import event, for the "Meus Arquivos" history. */
export const imports = pgTable("imports", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  count: integer("count").notNull(),
  added: integer("added").notNull(),
  mode: text("mode").notNull(), // "merge" | "replace"
  createdAt: timestamp("created_at").defaultNow(),
});

/** One public tracking lookup — captures the device that consulted a code. */
export const lookups = pgTable("lookups", {
  id: serial("id").primaryKey(),
  codigo: text("codigo"), // matched order code (null when not found)
  query: text("query"), // what the visitor typed
  cliente: text("cliente"), // client name snapshot, for convenience
  found: integer("found").default(1), // 1 = matched an order, 0 = not found
  device: text("device"), // "Samsung · SM-A515F", "iPhone", "Xiaomi Redmi…"
  brand: text("brand"), // Samsung / Xiaomi / Apple / …
  os: text("os"), // Android 13 / iOS / Windows…
  browser: text("browser"), // Chrome / Safari / Samsung Internet…
  ip: text("ip"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type OrderRow = typeof orders.$inferSelect;
export type NewOrderRow = typeof orders.$inferInsert;
export type ImportRow = typeof imports.$inferSelect;
export type LookupRow = typeof lookups.$inferSelect;
