import { desc } from "drizzle-orm";
import { getDb, schema } from "./db.js";
import type { NewOrderRow, WebhookEventRow } from "./schema.js";
import { toCanonicalStatus, generateTrackingCode, formatDate, toIsoDate } from "./csv-lpqv.js";

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
  codigoderastreio: "codigoRastreio", codigorastreio: "codigoRastreio", rastreio: "codigoRastreio", trackingcode: "codigoRastreio",
  cod: "pedidoRef", codigo: "codigo", id: "pedidoRef", pedidoid: "pedidoRef", orderid: "pedidoRef",
  numero: "numero", numeropedido: "pedidoRef", reference: "pedidoRef", referencia: "pedidoRef",
  // cliente
  cliente: "cliente", nome: "cliente", nomecliente: "cliente", customername: "cliente", name: "cliente", destinatario: "cliente",
  documento: "cpf", cpf: "cpf", cpfcnpj: "cpf", document: "cpf",
  email: "email", telefone: "telefone", tel: "telefone", celular: "telefone", phone: "telefone",
  // status
  status: "status", statusenvio: "statusEnvio", statusdoenvio: "statusEnvio", situacao: "statusEnvio", shippingstatus: "statusEnvio",
  // endereço
  endereco: "endereco", logradouro: "endereco", rua: "endereco", address: "endereco", street: "endereco",
  complemento: "complemento", complement: "complemento",
  bairro: "bairro", neighborhood: "bairro",
  cidade: "cidade", city: "cidade",
  uf: "uf", estado: "uf", state: "uf",
  cep: "cep", zip: "cep", zipcode: "cep", postalcode: "cep",
  // produto
  produto: "produto", produtodescricao: "produto", nomeproduto: "produto", product: "produto", title: "produto",
  produtofoto: "produtoFoto", foto: "produtoFoto", imagem: "produtoFoto", image: "produtoFoto", productimage: "produtoFoto",
  produtosku: "produtoSku", sku: "produtoSku",
  qtde: "qtde", quantidade: "qtde", quantity: "qtde", qty: "qtde",
  // valores / frete / data / transportadora
  total: "valorTotal", valortotal: "valorTotal", totaldopedido: "valorTotal", amount: "valorTotal", ordertotal: "valorTotal",
  tipodefrete: "tipoFrete", tipofrete: "tipoFrete", frete: "tipoFrete", shipping: "tipoFrete",
  data: "data", date: "data", createdat: "data", orderdate: "data", datapedido: "data",
  transportadora: "transportadora", carrier: "transportadora",
};

const PRODUCT_ARRAY_KEYS = new Set(["produtos", "itens", "items", "products", "produto", "product"]);

/** Achata o payload: coleta escalares por chave normalizada + guarda arrays de produtos. */
function flatten(obj: unknown, fields: Record<string, string>, arrays: Record<string, any[]>, depth = 0) {
  if (!obj || typeof obj !== "object" || depth > 6) return;
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    if (v == null) continue;
    const nk = norm(k);
    if (Array.isArray(v)) {
      if (PRODUCT_ARRAY_KEYS.has(nk) && !arrays[nk]) arrays[nk] = v as any[];
      continue;
    }
    if (typeof v === "object") {
      flatten(v, fields, arrays, depth + 1);
      continue;
    }
    const field = KEY[nk];
    if (field && fields[field] === undefined) fields[field] = String(v);
  }
}

function firstProduct(arrays: Record<string, any[]>): Record<string, unknown> | null {
  for (const k of PRODUCT_ARRAY_KEYS) {
    const arr = arrays[k];
    if (Array.isArray(arr) && arr.length && typeof arr[0] === "object") return arr[0];
  }
  return null;
}

function pickFrom(o: Record<string, unknown>, keys: string[]): string {
  for (const [k, v] of Object.entries(o)) {
    if (v == null || typeof v === "object") continue;
    if (keys.includes(norm(k))) return String(v);
  }
  return "";
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

/** Tenta montar um pedido a partir do payload do webhook (formato desconhecido). */
export function parseWebhookOrder(payload: unknown): NewOrderRow | null {
  const fields: Record<string, string> = {};
  const arrays: Record<string, any[]> = {};
  flatten(payload, fields, arrays);

  // produto a partir de array, se não veio como escalar
  const prod = firstProduct(arrays);
  if (prod) {
    fields.produto ??= pickFrom(prod, ["produto", "produtodescricao", "nome", "name", "title", "descricao"]);
    fields.produtoFoto ??= pickFrom(prod, ["foto", "imagem", "image", "productimage", "produtofoto"]);
    fields.produtoSku ??= pickFrom(prod, ["sku", "produtosku"]);
    if (!fields.qtde) fields.qtde = pickFrom(prod, ["qtde", "quantidade", "quantity", "qty"]);
  }

  const pedidoRef = fields.pedidoRef || "";
  const cpf = fields.cpf || "";
  const codigoRastreio = fields.codigoRastreio || "";
  const codigoSimples = fields.codigo || "";
  if (!pedidoRef && !codigoSimples && !codigoRastreio && !cpf) return null;

  const generated = generateTrackingCode(pedidoRef || codigoSimples || cpf);
  const codigo = codigoRastreio || codigoSimples || generated;
  const { display, iso } = normalizeDate(fields.data || "");
  const qtde = parseInt(fields.qtde || "", 10);

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
    valorTotal: fields.valorTotal || null,
    codigoRastreio: codigo,
    transportadora: fields.transportadora || (process.env.TRANSPORTADORA || "").trim() || null,
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
