export type StepState = "done" | "current" | "future";

/** One movement entry in the tracking history. */
export interface TimelineStep {
  key: string;
  label: string;
  location?: string;
  time?: string;
  state: StepState;
}

/** A tracked order, as returned by the API (mirrors the DB row). */
export interface Order {
  codigo: string;
  pedidoRef?: string | null;
  cpf?: string | null;
  cliente: string;
  email?: string | null;
  telefone?: string | null;
  status: string;
  statusEnvio?: string | null;
  statusPagamento?: string | null;
  cidade?: string | null;
  uf?: string | null;
  cep?: string | null;
  endereco?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  produto?: string | null;
  produtoSku?: string | null;
  produtoFoto?: string | null;
  qtde?: number | null;
  tipoFrete?: string | null;
  valorFrete?: string | null;
  valorTotal?: string | null;
  meioPagamento?: string | null;
  codigoRastreio?: string | null;
  transportadora?: string | null;
  origem?: string | null;
  data?: string | null;
  dataPedido?: string | null;
  previsao?: string | null;
  createdAt?: string | null;
}

/** A CSV import event (admin "Meus Arquivos"). */
export interface ImportRecord {
  id: number;
  name: string;
  count: number;
  added: number;
  mode: "merge" | "replace" | string;
  createdAt?: string | null;
}

/** A public tracking lookup captured from a visitor's device. */
export interface Lookup {
  id: number;
  codigo?: string | null;
  query?: string | null;
  cliente?: string | null;
  found?: number | null;
  device?: string | null;
  brand?: string | null;
  os?: string | null;
  browser?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  createdAt?: string | null;
}
