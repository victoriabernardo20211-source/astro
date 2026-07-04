import type { Order } from "./types";

const EXPORT_COLUMNS: Array<[string, keyof Order]> = [
  ["codigo", "codigo"],
  ["pedido", "pedidoRef"],
  ["cliente", "cliente"],
  ["cpf", "cpf"],
  ["status", "status"],
  ["cidade", "cidade"],
  ["uf", "uf"],
  ["cep", "cep"],
  ["endereco", "endereco"],
  ["numero", "numero"],
  ["bairro", "bairro"],
  ["produto", "produto"],
  ["qtde", "qtde"],
  ["frete", "tipoFrete"],
  ["total", "valorTotal"],
  ["data", "data"],
];

function escapeCsv(value: string): string {
  return /[",\n;]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/** Serializes orders into a CSV string for download. */
export function ordersToCsv(orders: Order[]): string {
  const header = EXPORT_COLUMNS.map(([h]) => h).join(",");
  const rows = orders.map((o) =>
    EXPORT_COLUMNS.map(([, key]) => escapeCsv(String(o[key] ?? ""))).join(",")
  );
  return [header, ...rows].join("\n");
}

/** A minimal template accepted by the importer (also reads the full LPQV export). */
export const CSV_TEMPLATE = [
  "codigo,cliente,cpf,cidade,uf,status,produto,data",
  "AF-1001-BR,Maria Souza,304.118.756-09,Salvador,BA,Em trânsito,Produto exemplo,15 jun 2026",
].join("\n");
