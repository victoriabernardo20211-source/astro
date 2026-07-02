import { desc } from "drizzle-orm";
import { getDb, schema } from "./db.js";
import type { NewOrderRow, WebhookEventRow } from "./schema.js";
import { toCanonicalStatus, generateTrackingCode, formatDate, toIsoDate } from "./csv-lpqv.js";
import { parseUa, platformOf } from "./ua.js";

const { webhookEvents } = schema;

function norm(k: string): string {
  return k
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[\s_-]+/g, "")
    .trim();
}

/** normaliza chaves conhecidas (várias grafias) -> campo interno */
const KEY: Record<string, string> = {
  // código / número do pedido
  codigoderastreio: "codigoRastreio", codigorastreio: "codigoRastreio", rastreio: "codigoRastreio",
  trackingcode: "codigoRastreio",
  cod: "pedidoRef", codigo: "codigo", token: "pedidoRef", pedidoid: "pedidoRef", orderid: "pedidoRef",
  numeropedido: "pedidoRef", reference: "pedidoRef", referencia: "pedidoRef",
  // cliente
  cliente: "cliente", nome: "cliente", nomecliente: "cliente", customername: "cliente",
  name: "cliente", destinatario: "cliente", recipient: "cliente",
  documento: "cpf", cpf: "cpf", cpfcnpj: "cpf", document: "cpf", customercpf: "cpf",
  email: "email", customeremail: "email",
  telefone: "telefone", tel: "telefone", celular: "telefone", phone: "telefone", phonenumber: "telefone",
  // status
  status: "status", statusenvio: "statusEnvio", statusdoenvio: "statusEnvio", situacao: "statusEnvio",
  shippingstatus: "statusEnvio", event: "statusEnvio",
  // endereço
  endereco: "endereco", logradouro: "endereco", rua: "endereco", address: "endereco", street: "endereco",
  numero: "numero", number: "numero", num: "numero",
  complemento: "complemento", complement: "complemento",
  bairro: "bairro", neighborhood: "bairro", district: "bairro",
  cidade: "cidade", city: "cidade",
  uf: "uf", estado: "uf", state: "uf",
  cep: "cep", zip: "cep", zipcode: "cep", postalcode: "cep",
  // produto
  produto: "produto", produtodescricao: "produto", productdescription: "produto",
  nomeproduto: "produto", title: "produto",
  produtofoto: "produtoFoto", foto: "produtoFoto", imagem: "produtoFoto", productimage: "produtoFoto",
  produtosku: "produtoSku", sku: "produtoSku", productvariantsku: "produtoSku",
  qtde: "qtde", quantidade: "qtde", quantity: "qtde", qty: "qtde", productqtdy: "qtde",
  // valores / frete / data / transportadora
  total: "valorTotal", valortotal: "valorTotal", totaldopedido: "valorTotal",
  paymentsubtotal: "valorTotal", paymenttotal: "valorTotal", shopifyamounet: "valorTotal", ordertotal: "valorTotal",
  tipodefrete: "tipoFrete", tipofrete: "tipoFrete", shippingtype: "tipoFrete",
  data: "data", date: "data", createdat: "data", creatat: "data", orderdate: "data",
  transportadora: "transportadora", carrier: "transportadora",
  // dispositivo de quem FEZ o pedido (aparelho usado no checkout)
  clientuseragent: "userAgent", useragent: "userAgent", customeruseragent: "userAgent",
};

/** Desembrulha o pedido de dentro de envelopes comuns (response.result[0], data, order…). */
function unwrapOrder(payload: any): any {
  let p = payload;
  for (let i = 0; i < 4 && p && typeof p === "object"; i++) {
    if (p.response && typeof p.response === "object") {
      p = p.response;
      continue;
    }
    if (Array.isArray(p.result) && p.result[0]) return p.result[0];
    if (p.result && typeof p.result === "object" && !Array.isArray(p.result)) {
      p = p.result;
      continue;
    }
    if (Array.isArray(p.data) && p.data[0]) return p.data[0];
    if (p.data && typeof p.data === "object") { p = p.data; continue; }
    if (p.order && typeof p.order === "object") return p.order;
    if (p.pedido && typeof p.pedido === "object") return p.pedido;
    break;
  }
  if (Array.isArray(p) && p[0]) return p[0];
  return p;
}

/** Achata um objeto: escalares por chave normalizada (1ª ocorrência vence) + desce em objetos e arrays. */
function flatten(obj: unknown, fields: Record<string, string>, depth = 0) {
  if (!obj || typeof obj !== "object" || depth > 6) return;
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    if (v == null) continue;
    if (Array.isArray(v)) {
      for (const el of v) if (el && typeof el === "object") flatten(el, fields, depth + 1);
      continue;
    }
    if (typeof v === "object") {
      flatten(v, fields, depth + 1);
      continue;
    }
    const field = KEY[norm(k)];
    if (field && fields[field] === undefined) fields[field] = String(v);
  }
}

/** "99.90" -> "99,90" (decimal BR) para exibir consistente. */
function brMoney(v?: string): string | null {
  if (!v) return null;
  const s = String(v).trim();
  if (/^\d+(\.\d+)?$/.test(s)) return Number(s).toFixed(2).replace(".", ",");
  return s;
}

function normalizeDate(raw: string): { display: string; iso: string | null } {
  if (!raw) return { display: "", iso: null };
  // ISO (YYYY-MM-DD...)
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    const meses = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
    const [, y, mo, d] = iso;
    return { display: `${d} ${meses[Number(mo) - 1] ?? mo} ${y}`, iso: `${y}-${mo}-${d}` };
  }
  return { display: formatDate(raw), iso: toIsoDate(raw) };
}

/** Monta um pedido a partir do payload do webhook da LPQV (envelope response.result[]). */
export function parseWebhookOrder(payload: unknown): NewOrderRow | null {
  const order = unwrapOrder(payload);
  const fields: Record<string, string> = {};
  flatten(order, fields);

  const pedidoRef = fields.pedidoRef || "";
  const cpf = fields.cpf || "";
  const codigoRastreio = fields.codigoRastreio || "";
  const codigoSimples = fields.codigo || "";
  if (!pedidoRef && !codigoSimples && !codigoRastreio && !cpf) return null;

  const generated = generateTrackingCode(pedidoRef || codigoSimples || cpf);
  const codigo = codigoRastreio || codigoSimples || generated;
  const { display, iso } = normalizeDate(fields.data || "");
  const qtde = parseInt(fields.qtde || "", 10);
  const deviceInfo = fields.userAgent ? parseUa(fields.userAgent) : null;

  return {
    codigo,
    pedidoRef: pedidoRef || null,
    cpf: cpf || null,
    cliente: fields.cliente || "Cliente",
    email: fields.email || null,
    telefone: fields.telefone || null,
    status: toCanonicalStatus(fields.statusEnvio || "", fields.status || ""),
    statusEnvio: fields.statusEnvio || fields.status || null,
    statusPagamento: fields.status || null,
    cidade: fields.cidade || null,
    uf: (fields.uf || "").toUpperCase() || null,
    cep: fields.cep || null,
    endereco: fields.endereco || null,
    numero: fields.numero || null,
    complemento: fields.complemento || null,
    bairro: fields.bairro || null,
    produto: fields.produto || null,
    produtoSku: fields.produtoSku || null,
    produtoFoto: fields.produtoFoto || null,
    qtde: Number.isFinite(qtde) && qtde > 0 ? qtde : 1,
    tipoFrete: fields.tipoFrete || null,
    valorTotal: brMoney(fields.valorTotal),
    codigoRastreio: codigo,
    transportadora: fields.transportadora || (process.env.TRANSPORTADORA || "").trim() || null,
    dispositivo: deviceInfo?.device || null,
    dispositivoMarca: deviceInfo?.brand || null,
    dispositivoOs: deviceInfo?.os || null,
    plataforma: deviceInfo ? platformOf(deviceInfo) : null,
    origem: "Centro de distribuição LPQV",
    data: display,
    dataPedido: iso,
    previsao: null,
  } as NewOrderRow;
}

export async function recordWebhookEvent(e: {
  method: string;
  codigo: string | null;
  cliente: string | null;
  ok: boolean;
  message: string;
  raw: string;
}): Promise<void> {
  const db = await getDb();
  await db.insert(webhookEvents).values({
    method: e.method,
    codigo: e.codigo,
    cliente: e.cliente,
    ok: e.ok ? 1 : 0,
    message: e.message.slice(0, 300),
    raw: e.raw.slice(0, 20000),
  });
  await db.execute(
    (await import("drizzle-orm")).sql`DELETE FROM webhook_events WHERE created_at < now() - interval '30 days'`
  );
}

export async function listWebhookEvents(): Promise<WebhookEventRow[]> {
  const db = await getDb();
  return db.select().from(webhookEvents).orderBy(desc(webhookEvents.createdAt)).limit(50);
}
