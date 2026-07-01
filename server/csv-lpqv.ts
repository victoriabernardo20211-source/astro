import type { NewOrderRow } from "./schema";

export interface ParseResult {
  orders: NewOrderRow[];
  errors: string[];
}

/**
 * Transportadora padrão aplicada aos pedidos importados quando a planilha não
 * traz uma. Defina a variável de ambiente TRANSPORTADORA (ex.: "Loggi") — deve
 * ser a transportadora real que faz a entrega.
 */
const DEFAULT_CARRIER = (process.env.TRANSPORTADORA || "").trim();

/** Splits a CSV line honoring double-quoted fields (commas inside quotes). */
function splitLine(line: string, delimiter: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delimiter && !inQuotes) {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map((c) => c.trim());
}

function detectDelimiter(header: string): string {
  return header.split(";").length > header.split(",").length ? ";" : ",";
}

/** lowercase + strip accents so "Endereço" and "endereco" match. */
function norm(h: string): string {
  return h
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

const ALIASES: Record<string, string> = {
  cod: "pedidoRef",
  "codigo do pedido": "pedidoRef",
  pedido: "pedidoRef",
  codigo: "codigo",
  rastreio: "codigoRastreio",
  "codigo de rastreio": "codigoRastreio",
  data: "data",
  cliente: "cliente",
  nome: "cliente",
  destinatario: "cliente",
  email: "email",
  "e-mail": "email",
  tel: "telefone",
  telefone: "telefone",
  celular: "telefone",
  documento: "cpf",
  cpf: "cpf",
  "cpf/cnpj": "cpf",
  status: "status",
  "status envio": "statusEnvio",
  "status do envio": "statusEnvio",
  "situacao envio": "statusEnvio",
  endereco: "endereco",
  logradouro: "endereco",
  rua: "endereco",
  numero: "numero",
  num: "numero",
  complemento: "complemento",
  bairro: "bairro",
  cidade: "cidade",
  uf: "uf",
  estado: "uf",
  "cidade/uf": "cidadeuf",
  destino: "cidadeuf",
  cep: "cep",
  "produto sku": "produtoSku",
  sku: "produtoSku",
  "produto descricao": "produto",
  produto: "produto",
  item: "produto",
  qtde: "qtde",
  quantidade: "qtde",
  qtd: "qtde",
  "produto foto": "produtoFoto",
  foto: "produtoFoto",
  imagem: "produtoFoto",
  "tipo de frete": "tipoFrete",
  "tipo frete": "tipoFrete",
  frete: "tipoFrete",
  servico: "tipoFrete",
  "valor frete": "valorFrete",
  "total do pedido": "valorTotal",
  total: "valorTotal",
  "valor total": "valorTotal",
  "meio de pagamento": "meioPagamento",
  pagamento: "meioPagamento",
  previsao: "previsao",
  origem: "origem",
  transportadora: "transportadora",
  transportador: "transportadora",
  "transportadora responsavel": "transportadora",
};

/** Ordem fixa das colunas do export da LPQV (usada quando não vem cabeçalho). */
const DEFAULT_LPQV_RAW = [
  "Cód", "Data", "Cliente", "Email", "Tel", "Tipo documento", "Documento",
  "Status", "Cupom", "Endereço", "Número", "Complemento", "Bairro", "Cidade",
  "UF", "País", "CEP", "Status envio", "Produto SKU", "Produto descrição",
  "Qtde", "Produto foto", "Customização", "Tipo de frete", "Valor frete",
  "Código de rastreio", "Total do pedido", "Parcelas", "Valor da parcela",
  "Meio de pagamento", "Obs",
];
const DEFAULT_LPQV_HEADERS = DEFAULT_LPQV_RAW.map((h) => ALIASES[norm(h)] ?? norm(h));

/**
 * Gera um código de rastreio determinístico a partir do número do pedido, para
 * que reimportar o mesmo pedido produza sempre o mesmo código (idempotente e
 * vinculado ao número do pedido). Formato: AF + 10 dígitos + BR.
 */
export function generateTrackingCode(seed: string): string {
  let h = 1469598103934665603n; // FNV-1a 64-bit
  const s = seed || "pedido";
  for (let i = 0; i < s.length; i++) {
    h ^= BigInt(s.charCodeAt(i));
    h = (h * 1099511628211n) & 0xffffffffffffffffn;
  }
  const num = (h % 10000000000n).toString().padStart(10, "0");
  return `AF${num}BR`;
}

const MESES = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
];

/** "26/06/2026 16:44:49" → "26 jun 2026". Falls back to the raw input. */
function formatDate(raw: string): string {
  const m = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (!m) return raw || "";
  const [, d, mo, y] = m;
  const mon = MESES[Number(mo) - 1] ?? mo;
  return `${d.padStart(2, "0")} ${mon} ${y.length === 2 ? "20" + y : y}`;
}

/** "26/06/2026 16:44:49" → "2026-06-26" (ISO date), or null. */
function toIsoDate(raw: string): string | null {
  const m = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (!m) return null;
  let [, d, mo, y] = m;
  if (y.length === 2) y = "20" + y;
  return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

/** Maps the store's shipping/payment status to one of the 8 canonical stages. */
export function toCanonicalStatus(envio: string, pagamento: string): string {
  const s = norm(envio);
  if (!s && !pagamento) return "Pedido recebido";
  if (s.includes("entregue")) return "Entregue";
  if (s.includes("saiu")) return "Saiu para entrega";
  if (s.includes("rota")) return "Em rota";
  if (s.includes("chegou") || s.includes("destino")) return "Chegou no estado destino";
  if (
    s.includes("transito") ||
    s.includes("transporte") ||
    s.includes("enviado") ||
    s.includes("postado") ||
    s.includes("a caminho") ||
    s.includes("transportadora")
  )
    return "Em trânsito";
  if (s.includes("coletad") || s.includes("coleta")) return "Coletado";
  if (s.includes("separa") || s.includes("preparando") || s.includes("processando"))
    return "Em separação";
  if (s.includes("aprovado") || s.includes("faturado")) return "Em separação";
  if (s.includes("recebido") || s.includes("novo") || s.includes("aguardando") || s.includes("pendente"))
    return "Pedido recebido";
  // fall back to the payment status
  const p = norm(pagamento);
  if (p.includes("aprovado") || p.includes("realizado") || p.includes("pago"))
    return "Em separação";
  return "Pedido recebido";
}

/** Parses an LPQV/Lumilar export (or the simple template) into order rows. */
export function parseLpqvCsv(text: string): ParseResult {
  const errors: string[] = [];
  const lines = text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .filter((l) => l.trim().length > 0);

  if (lines.length < 1) {
    return { orders: [], errors: ["O arquivo está vazio."] };
  }

  const delimiter = detectDelimiter(lines[0]);

  // A primeira linha é cabeçalho? (senão, assume a ordem fixa da LPQV)
  const firstCells = splitLine(lines[0], delimiter).map(norm);
  const HEADER_HINTS = new Set([
    "cod", "codigo", "cliente", "documento", "cpf", "data", "status envio",
    "produto descricao", "cidade", "email", "cep",
  ]);
  const looksLikeHeader =
    firstCells.filter((c) => HEADER_HINTS.has(c)).length >= 2;

  const headers = looksLikeHeader
    ? splitLine(lines[0], delimiter).map((h) => ALIASES[norm(h)] ?? norm(h))
    : DEFAULT_LPQV_HEADERS;
  const dataStart = looksLikeHeader ? 1 : 0;
  const hasEnvio = headers.includes("statusEnvio");

  if (
    !headers.includes("cliente") &&
    !headers.includes("cpf") &&
    !headers.includes("pedidoRef")
  ) {
    return {
      orders: [],
      errors: ['Cabeçalho não reconhecido. Esperado um export com colunas como "Cliente", "Documento", "Status envio".'],
    };
  }

  const orders: NewOrderRow[] = [];
  const seen = new Set<string>();

  for (let r = dataStart; r < lines.length; r++) {
    const cells = splitLine(lines[r], delimiter);
    const get = (key: string): string => {
      const idx = headers.indexOf(key);
      return idx >= 0 ? (cells[idx] ?? "").trim() : "";
    };

    let cidade = get("cidade");
    let uf = get("uf");
    const combined = get("cidadeuf");
    if ((!cidade || !uf) && combined) {
      const parts = combined.split("/").map((p) => p.trim());
      cidade = cidade || parts[0] || "";
      uf = uf || parts[1] || "";
    }

    const pedidoRef = get("pedidoRef");
    const codigoRastreioCsv = get("codigoRastreio");
    const codigoSimples = get("codigo");
    const cpf = get("cpf");
    const cliente = get("cliente");

    if (!pedidoRef && !codigoSimples && !codigoRastreioCsv && !cpf) {
      errors.push(`Linha ${r + 1} ignorada: sem número de pedido nem CPF.`);
      continue;
    }

    // Código de rastreio gerado e vinculado ao número do pedido (determinístico:
    // reimportar o mesmo pedido mantém o mesmo código). Respeita um código real
    // de rastreio, caso o export já traga um.
    const generated = generateTrackingCode(pedidoRef || codigoSimples || cpf);
    const codigo = codigoRastreioCsv || codigoSimples || generated;

    // de-dup dentro do arquivo (pedidos repetem por item)
    const key = pedidoRef || codigo || cpf;
    if (seen.has(key)) continue;
    seen.add(key);

    // When the file has a dedicated "Status envio", "status" is the payment
    // status; otherwise the single "status" column is the shipping status.
    const statusEnvio = hasEnvio ? get("statusEnvio") : get("status");
    const statusPagamento = hasEnvio ? get("status") : "";
    const qtde = parseInt(get("qtde"), 10);

    orders.push({
      codigo,
      pedidoRef: pedidoRef || null,
      cpf: cpf || null,
      cliente: cliente || "Cliente",
      email: get("email") || null,
      telefone: get("telefone") || null,
      status: toCanonicalStatus(statusEnvio, statusPagamento),
      statusEnvio: statusEnvio || null,
      statusPagamento: statusPagamento || null,
      cidade: cidade || null,
      uf: (uf || "").toUpperCase() || null,
      cep: get("cep") || null,
      endereco: get("endereco") || null,
      numero: get("numero") || null,
      complemento: get("complemento") || null,
      bairro: get("bairro") || null,
      produto: get("produto") || null,
      produtoSku: get("produtoSku") || null,
      produtoFoto: get("produtoFoto") || null,
      qtde: Number.isFinite(qtde) && qtde > 0 ? qtde : 1,
      tipoFrete: get("tipoFrete") || null,
      valorFrete: get("valorFrete") || null,
      valorTotal: get("valorTotal") || null,
      meioPagamento: get("meioPagamento") || null,
      codigoRastreio: codigo,
      // transportadora: da planilha, senão o padrão definido em TRANSPORTADORA
      transportadora: get("transportadora") || DEFAULT_CARRIER || null,
      origem: get("origem") || "Centro de distribuição LPQV",
      data: formatDate(get("data")),
      dataPedido: toIsoDate(get("data")),
      previsao: get("previsao") || null,
    });
  }

  if (orders.length === 0 && errors.length === 0) {
    errors.push("Nenhum pedido válido encontrado no arquivo.");
  }
  return { orders, errors };
}
