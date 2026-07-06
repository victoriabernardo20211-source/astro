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
  // dispositivo usado para FAZER o pedido (do webhook LPQV, client_user_agent)
  dispositivo: text("dispositivo"), // "iPhone", "Samsung · SM-A515F"…
  dispositivoMarca: text("dispositivo_marca"), // Apple / Samsung / Xiaomi…
  dispositivoOs: text("dispositivo_os"), // iOS 17.4 / Android 13…
  plataforma: text("plataforma"), // "iOS" | "Android" | "Computador" | "Outro"
  origem: text("origem"),
  data: text("data"), // order date as shown (display)
  dataPedido: text("data_pedido"), // ISO date (YYYY-MM-DD) for estimated timeline
  previsao: text("previsao"),
  emailEnviadoEm: text("email_enviado_em"), // ISO datetime quando o e-mail foi enviado (null = não enviado)
  acaminhoBaixadoEm: text("acaminho_baixado_em"), // ISO datetime da 2ª exportação ("a caminho", pós-notificação)
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

/** Visitantes ativos (heartbeat) para o "quem está online". */
export const presence = pgTable("presence", {
  id: text("id").primaryKey(), // id de sessão do navegador
  path: text("path"),
  ip: text("ip"),
  device: text("device"),
  brand: text("brand"),
  os: text("os"),
  browser: text("browser"),
  firstSeen: timestamp("first_seen").defaultNow(),
  lastSeen: timestamp("last_seen").defaultNow(),
});

/** Tentativas de login (para bloquear força-bruta por IP). */
export const loginAttempts = pgTable("login_attempts", {
  id: serial("id").primaryKey(),
  ip: text("ip"),
  ok: integer("ok").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

/** Eventos recebidos por webhook (LPQV), com o payload bruto para depuração. */
export const webhookEvents = pgTable("webhook_events", {
  id: serial("id").primaryKey(),
  method: text("method"),
  codigo: text("codigo"),
  cliente: text("cliente"),
  ok: integer("ok").default(1),
  message: text("message"),
  raw: text("raw"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type OrderRow = typeof orders.$inferSelect;
export type NewOrderRow = typeof orders.$inferInsert;
export type ImportRow = typeof imports.$inferSelect;
export type LookupRow = typeof lookups.$inferSelect;
export type PresenceRow = typeof presence.$inferSelect;
export type WebhookEventRow = typeof webhookEvents.$inferSelect;
