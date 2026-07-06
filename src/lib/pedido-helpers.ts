import type { Order } from "./types";
import { statusIndex, currentStatusLabel, paymentStatus, paymentBadge } from "./data";

export function money(s?: string | null): number {
  if (!s) return 0;
  let v = String(s).trim();
  if (v.includes(",")) v = v.replace(/\./g, "").replace(",", ".");
  const n = parseFloat(v.replace(/[^\d.-]/g, ""));
  return isNaN(n) ? 0 : n;
}

export const brl = (n: number) =>
  "R$ " + n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function localToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

/** Data (YYYY-MM-DD) do pedido — usada pra agrupar/filtrar por dia. */
export function orderDay(o: Order): string {
  return (o.dataPedido || o.createdAt || "").slice(0, 10);
}

export const isToday = (o: Order) => orderDay(o) === localToday();
export const pago = (o: Order) => paymentStatus(o) === "pago";
export const notificado = (o: Order) => !!o.emailEnviadoEm;
// pool base p/ downloads: pagos, ainda não notificados (com ou sem e-mail)
export const pagoNaoNotificado = (o: Order) => pago(o) && !notificado(o);
// só notifica PAGOS, com e-mail e ainda não enviados
export const aNotificar = (o: Order) => pagoNaoNotificado(o) && !!o.email;
// "Pagos" = só quem ainda não tem pra onde ir — sem e-mail, não caiu em "A
// notificar" nem em "A caminho" (é mutuamente exclusivo com as outras abas)
export const pagosSemAcao = (o: Order) => pagoNaoNotificado(o) && !o.email;
export const entregue = (o: Order) => statusIndex(o.status || "") === 7;
export const emTransporte = (o: Order) => {
  const i = statusIndex(currentStatusLabel(o));
  return i >= 2 && i <= 6;
};

/** Cores do selo de plataforma (dispositivo usado para FAZER o pedido). */
export function platformBadge(p?: string | null): { bg: string; fg: string; label: string } {
  if (p === "iOS") return { bg: "#E5E7EB", fg: "#111827", label: "iOS" };
  if (p === "Android") return { bg: "#D8F5E3", fg: "#1F8A5B", label: "Android" };
  if (p === "Computador") return { bg: "#DBEAFE", fg: "#1D4ED8", label: "Computador" };
  return { bg: "#F1F5F9", fg: "#64748B", label: p || "—" };
}

function toCsvValue(v: string | number | null | undefined): string {
  const s = String(v ?? "");
  return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Exporta os pedidos informados como CSV (separador ;) e dispara o download. */
export function exportCsv(rows: Order[], filename: string) {
  const headers = [
    "Pedido", "Cliente", "CPF", "Telefone", "Email", "Cidade", "UF",
    "Status", "Pagamento", "Dispositivo", "Plataforma", "Data",
  ];
  const lines = [headers.join(";")];
  for (const o of rows) {
    lines.push(
      [
        o.pedidoRef || o.codigo,
        o.cliente,
        o.cpf || "",
        o.telefone || "",
        o.email || "",
        o.cidade || "",
        o.uf || "",
        currentStatusLabel(o),
        paymentBadge(paymentStatus(o)).label,
        o.dispositivo || "",
        o.plataforma || "",
        o.data || "",
      ]
        .map(toCsvValue)
        .join(";")
    );
  }
  const blob = new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
