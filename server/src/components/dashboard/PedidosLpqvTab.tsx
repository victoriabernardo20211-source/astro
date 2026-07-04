import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAdmin } from "@/lib/admin-store";
import type { Order } from "@/lib/types";
import {
  statusBadge,
  statusIndex,
  currentStatusLabel,
  paymentStatus,
  paymentBadge,
} from "@/lib/data";
import { Search, Mail, Trash, Package, Check, Bell, Download, Smartphone, Monitor } from "@/components/icons";

function money(s?: string | null): number {
  if (!s) return 0;
  let v = String(s).trim();
  if (v.includes(",")) v = v.replace(/\./g, "").replace(",", ".");
  const n = parseFloat(v.replace(/[^\d.-]/g, ""));
  return isNaN(n) ? 0 : n;
}
const brl = (n: number) =>
  "R$ " + n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function localToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}
function orderDay(o: Order): string {
  return (o.dataPedido || o.createdAt || "").slice(0, 10);
}

const isToday = (o: Order) => orderDay(o) === localToday();
const pago = (o: Order) => paymentStatus(o) === "pago";
// só notifica PAGOS, com e-mail e ainda não enviados
const aNotificar = (o: Order) => pago(o) && !!o.email && !o.emailEnviadoEm;
const notificado = (o: Order) => !!o.emailEnviadoEm;
// pool do "Baixar todos X": só pagos e ainda não notificados
const pagoENaoNotificado = (o: Order) => pago(o) && !o.emailEnviadoEm;
const entregue = (o: Order) => statusIndex(o.status || "") === 7;
const emTransporte = (o: Order) => {
  const i = statusIndex(currentStatusLabel(o));
  return i >= 2 && i <= 6;
};

const FILTERS: Array<{ key: string; label: string; test: (o: Order) => boolean }> = [
  { key: "todos", label: "Todos", test: () => true },
  { key: "hoje", label: "Novos do dia", test: isToday },
  { key: "pagos", label: "Pagos", test: pago },
  { key: "pendentes", label: "Pendentes", test: (o) => paymentStatus(o) === "pendente" },
  { key: "cancelados", label: "Cancelados", test: (o) => paymentStatus(o) === "cancelado" },
  { key: "notificar", label: "A notificar", test: aNotificar },
  { key: "notificados", label: "Notificados", test: notificado },
  { key: "transporte", label: "Em transporte", test: emTransporte },
  { key: "entregues", label: "Entregues", test: entregue },
  { key: "ios", label: "iOS", test: (o) => o.plataforma === "iOS" },
  { key: "android", label: "Android", test: (o) => o.plataforma === "Android" },
];

/** Cores do selo de plataforma (dispositivo usado para FAZER o pedido). */
function platformBadge(p?: string | null): { bg: string; fg: string; label: string } {
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
function exportCsv(rows: Order[], filename: string) {
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

export default function PedidosLpqvTab() {
  const { orders, loading, sendEmails, deleteOrders, deleteAll, markNotified } = useAdmin();
  const [filter, setFilter] = useState("todos");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  // some da lista assim que marcados, pra nunca baixar/notificar o mesmo 2x
  const iosPendentes = useMemo(
    () => orders.filter((o) => o.plataforma === "iOS" && pagoENaoNotificado(o)),
    [orders]
  );
  const androidPendentes = useMemo(
    () => orders.filter((o) => o.plataforma === "Android" && pagoENaoNotificado(o)),
    [orders]
  );

  const stats = useMemo(() => {
    const total = orders.length;
    const novos = orders.filter(isToday).length;
    const notificar = orders.filter(aNotificar).length;
    const notificados = orders.filter(notificado).length;
    const vendas = orders.reduce((s, o) => s + money(o.valorTotal), 0);
    return { total, novos, notificar, notificados, vendas };
  }, [orders]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const test = FILTERS.find((f) => f.key === filter)?.test ?? (() => true);
    return orders.filter((o) => {
      if (!test(o)) return false;
      if (!q) return true;
      return [o.cliente, o.cpf, o.codigo, o.pedidoRef, o.cidade, o.uf, o.email]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [orders, filter, query]);

  const cards = [
    { icon: Package, label: "Pedidos", value: String(stats.total), tint: "#7B2FBE" },
    { icon: Bell, label: "Novos do dia", value: String(stats.novos), tint: "#6B23B0" },
    { icon: Mail, label: "A notificar", value: String(stats.notificar), tint: "#C2410C" },
    { icon: Check, label: "Clientes notificados", value: String(stats.notificados), tint: "#1F8A5B" },
    { icon: Check, label: "Vendas (total)", value: brl(stats.vendas), tint: "#1F8A5B" },
  ];

  const allShownSelected =
    filtered.length > 0 && filtered.every((o) => selected.has(o.codigo));
  const toggle = (c: string) =>
    setSelected((p) => {
      const n = new Set(p);
      n.has(c) ? n.delete(c) : n.add(c);
      return n;
    });
  const toggleAll = () =>
    setSelected((p) => {
      const n = new Set(p);
      if (allShownSelected) filtered.forEach((o) => n.delete(o.codigo));
      else filtered.forEach((o) => n.add(o.codigo));
      return n;
    });

  async function enviar() {
    const cods = [...selected];
    if (!cods.length) return;
    setBusy(true);
    setMsg("");
    try {
      const r = await sendEmails(cods);
      if (!r.mailConfigured) setMsg("SMTP não configurado.");
      else {
        const p = [`${r.sent} enviado(s)`];
        if (r.already) p.push(`${r.already} já enviados`);
        if (r.naoPago) p.push(`${r.naoPago} não pago(s)`);
        if (r.noEmail) p.push(`${r.noEmail} sem e-mail`);
        setMsg(p.join(" · "));
      }
      setSelected(new Set());
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Falha.");
    } finally {
      setBusy(false);
    }
  }

  /** Baixa o CSV de um grupo (iOS/Android) e pergunta se quer marcar como notificado. */
  async function baixarGrupo(rows: Order[], filename: string, label: string) {
    if (!rows.length) return;
    exportCsv(rows, filename);
    const marcar = confirm(
      `Baixado. Marcar os ${rows.length} pedido(s) ${label} como notificados, para eles não aparecerem de novo em "Baixar todos"?`
    );
    if (!marcar) return;
    setBusy(true);
    try {
      const { marked } = await markNotified(rows.map((o) => o.codigo));
      setMsg(`${marked} cliente(s) notificado(s).`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Falha ao marcar como notificado.");
    } finally {
      setBusy(false);
    }
  }

  async function apagarSel() {
    const cods = [...selected];
    if (!cods.length) return;
    if (!confirm(`Apagar ${cods.length} pedido(s)? Não pode ser desfeito.`)) return;
    setBusy(true);
    try {
      await deleteOrders(cods);
      setSelected(new Set());
    } finally {
      setBusy(false);
    }
  }
  async function apagarTudo() {
    if (!confirm(`Apagar TODOS os ${orders.length} pedidos? Não pode ser desfeito.`)) return;
    setBusy(true);
    try {
      await deleteAll();
      setSelected(new Set());
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="mb-5">
        <h3 className="font-display text-[18px] font-bold text-ink">Pedidos</h3>
        <p className="mt-1 text-[13px] text-muted">
          Todos os pedidos importados/recebidos, com filtros rápidos e ações.
        </p>
      </div>

      {/* Cartões de resumo */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {cards.map(({ icon: Icon, label, value, tint }) => (
          <div key={label} className="rounded-2xl border border-line bg-white p-[18px]">
            <span
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: `${tint}1A` }}
            >
              <Icon size={20} color={tint} />
            </span>
            <div className="mt-3 font-display text-[24px] font-extrabold text-ink">{value}</div>
            <div className="text-[12.5px] text-muted">{label}</div>
          </div>
        ))}
      </div>

      {/* Filtros + busca */}
      <div className="mt-6 flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => {
            const active = f.key === filter;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`rounded-full px-[14px] py-[7px] text-[12.5px] font-semibold transition-colors ${
                  active
                    ? "bg-brand text-white"
                    : "border border-field bg-white text-muted hover:text-brand"
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-[9px] rounded-[11px] border-[1.5px] border-field bg-white px-[14px] py-[10px] sm:max-w-[340px]">
          <Search size={16} color="#9A8FB0" className="flex-none" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar cliente, CPF, nº do pedido, código…"
            className="w-full bg-transparent text-[13px] text-ink outline-none"
          />
        </div>
      </div>

      {/* Ações em massa */}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          onClick={enviar}
          disabled={busy || selected.size === 0}
          className="flex items-center gap-2 rounded-[10px] bg-brand-mid px-[14px] py-[9px] text-[13px] font-bold text-white disabled:opacity-40"
        >
          <Mail size={15} color="#fff" /> Enviar e-mail ({selected.size})
        </button>
        <button
          onClick={apagarSel}
          disabled={busy || selected.size === 0}
          className="flex items-center gap-2 rounded-[10px] bg-[#C2410C] px-[14px] py-[9px] text-[13px] font-bold text-white disabled:opacity-40"
        >
          <Trash size={15} color="#fff" /> Apagar selecionados ({selected.size})
        </button>
        <button
          onClick={apagarTudo}
          disabled={busy || orders.length === 0}
          className="rounded-[10px] border-[1.5px] border-[#E0B4A0] bg-white px-[14px] py-[9px] text-[13px] font-bold text-[#C2410C] disabled:opacity-40"
        >
          Apagar tudo
        </button>
        {msg && <span className="text-[13px] font-medium text-brand">{msg}</span>}
      </div>

      {/* Exportar por dispositivo (quem fez o pedido pelo app iOS ou Android) — só pagos e ainda não notificados */}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          onClick={() => baixarGrupo(iosPendentes, "pedidos-ios.csv", "iOS")}
          disabled={busy || iosPendentes.length === 0}
          className="flex items-center gap-2 rounded-[10px] border-[1.5px] border-field bg-white px-[14px] py-[9px] text-[13px] font-bold text-ink disabled:opacity-40"
        >
          <Download size={15} color="#111827" /> Baixar todos iOS ({iosPendentes.length})
        </button>
        <button
          onClick={() => baixarGrupo(androidPendentes, "pedidos-android.csv", "Android")}
          disabled={busy || androidPendentes.length === 0}
          className="flex items-center gap-2 rounded-[10px] border-[1.5px] border-field bg-white px-[14px] py-[9px] text-[13px] font-bold text-[#1F8A5B] disabled:opacity-40"
        >
          <Download size={15} color="#1F8A5B" /> Baixar todos Android ({androidPendentes.length})
        </button>
      </div>

      {/* Lista */}
      <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-white">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13.5px]">
            <thead>
              <tr className="bg-brand-wash">
                <th className="px-[16px] py-[13px] text-left">
                  <input
                    type="checkbox"
                    aria-label="Selecionar todos"
                    checked={allShownSelected}
                    onChange={toggleAll}
                    className="h-4 w-4 accent-[#7B2FBE]"
                  />
                </th>
                {["Pedido", "Cliente", "Total", "Data", "Pagamento", "Status", "Dispositivo", "E-mail", ""].map((c) => (
                  <th
                    key={c}
                    className="whitespace-nowrap px-[16px] py-[13px] text-left text-[11.5px] font-bold uppercase tracking-[0.04em] text-brand-mid"
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => {
                const label = currentStatusLabel(o);
                const badge = statusBadge(label);
                const pay = paymentBadge(paymentStatus(o));
                const pf = platformBadge(o.plataforma);
                const sel = selected.has(o.codigo);
                return (
                  <tr
                    key={o.codigo}
                    className={`border-t border-[#F1ECF8] ${sel ? "bg-brand-tint/40" : ""}`}
                  >
                    <td className="px-[16px] py-[13px]">
                      <input
                        type="checkbox"
                        aria-label={`Selecionar ${o.codigo}`}
                        checked={sel}
                        onChange={() => toggle(o.codigo)}
                        className="h-4 w-4 accent-[#7B2FBE]"
                      />
                    </td>
                    <td className="whitespace-nowrap px-[16px] py-[13px]">
                      <div className="font-semibold text-brand">
                        {o.pedidoRef || o.codigo}
                      </div>
                      <div className="text-[11.5px] text-faint">{o.codigo}</div>
                    </td>
                    <td className="whitespace-nowrap px-[16px] py-[13px] font-semibold text-ink">
                      {o.cliente}
                      <div className="text-[11.5px] font-normal text-faint">
                        {o.cidade ? `${o.cidade}/${o.uf ?? ""}` : o.cpf || ""}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-[16px] py-[13px] tabular-nums text-ink">
                      {o.valorTotal ? brl(money(o.valorTotal)) : "—"}
                    </td>
                    <td className="whitespace-nowrap px-[16px] py-[13px] text-muted">
                      {o.data || "—"}
                    </td>
                    <td className="px-[16px] py-[13px]">
                      <span
                        className="whitespace-nowrap rounded-full px-[11px] py-[5px] text-[12px] font-bold"
                        style={{ background: pay.bg, color: pay.fg }}
                      >
                        {pay.label}
                      </span>
                    </td>
                    <td className="px-[16px] py-[13px]">
                      <span
                        className="whitespace-nowrap rounded-full px-[11px] py-[5px] text-[12px] font-bold"
                        style={{ background: badge.bg, color: badge.fg }}
                      >
                        {label}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-[16px] py-[13px]">
                      {o.plataforma ? (
                        <div>
                          <span
                            className="inline-flex items-center gap-1 rounded-full px-[9px] py-[4px] text-[11px] font-bold"
                            style={{ background: pf.bg, color: pf.fg }}
                          >
                            {o.plataforma === "Computador" ? (
                              <Monitor size={11} color={pf.fg} />
                            ) : (
                              <Smartphone size={11} color={pf.fg} />
                            )}
                            {pf.label}
                          </span>
                          {o.dispositivo && (
                            <div className="mt-[3px] text-[11px] text-faint">{o.dispositivo}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-[12px] text-faint">—</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-[16px] py-[13px]">
                      {o.emailEnviadoEm ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#D8F5E3] px-[9px] py-[4px] text-[11.5px] font-bold text-[#1F8A5B]">
                          <Check size={12} color="#1F8A5B" strokeWidth={3} /> enviado
                        </span>
                      ) : paymentStatus(o) !== "pago" ? (
                        <span className="text-[12px] text-faint">—</span>
                      ) : o.email ? (
                        <span className="text-[12px] text-[#C2410C]">a notificar</span>
                      ) : (
                        <span className="text-[12px] text-faint">sem e-mail</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-[16px] py-[13px] text-right">
                      <Link
                        to={`/rastrear?codigo=${encodeURIComponent(o.codigo)}`}
                        target="_blank"
                        className="font-bold text-brand-mid no-underline"
                      >
                        Visualizar
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr className="border-t border-[#F1ECF8]">
                  <td colSpan={10} className="px-4 py-10 text-center text-[13.5px] text-muted">
                    {loading ? "Carregando…" : "Nenhum pedido neste filtro."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
