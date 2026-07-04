import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAdmin } from "@/lib/admin-store";
import { statusBadge, statusIndex, currentStatusLabel } from "@/lib/data";
import { Search, Trash, Mail, Check } from "@/components/icons";

const COLUMNS = ["", "CPF", "Cliente", "Código", "Cidade/UF", "Status", "E-mail", "Data", "Ações"];

export default function TrackingsTab() {
  const { orders, loading, deleteOrders, deleteAll, sendEmails } = useAdmin();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [emailMsg, setEmailMsg] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((o) =>
      [o.cliente, o.cpf, o.codigo, o.cidade, o.uf, o.status]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [orders, query]);

  const active = orders.filter((o) => statusIndex(o.status) < 7).length;
  const allShownSelected =
    filtered.length > 0 && filtered.every((o) => selected.has(o.codigo));

  function toggle(codigo: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(codigo) ? next.delete(codigo) : next.add(codigo);
      return next;
    });
  }

  function toggleAllShown() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allShownSelected) filtered.forEach((o) => next.delete(o.codigo));
      else filtered.forEach((o) => next.add(o.codigo));
      return next;
    });
  }

  async function apagarSelecionados() {
    const codigos = [...selected];
    if (!codigos.length) return;
    if (!confirm(`Apagar ${codigos.length} pedido(s)? Esta ação não pode ser desfeita.`))
      return;
    setBusy(true);
    try {
      await deleteOrders(codigos);
      setSelected(new Set());
    } finally {
      setBusy(false);
    }
  }

  async function apagarTudo() {
    if (
      !confirm(
        `Apagar TODOS os ${orders.length} pedido(s) do banco? Esta ação não pode ser desfeita.`
      )
    )
      return;
    setBusy(true);
    try {
      await deleteAll();
      setSelected(new Set());
    } finally {
      setBusy(false);
    }
  }

  async function enviarEmails() {
    const codigos = [...selected];
    if (!codigos.length) return;
    setBusy(true);
    setEmailMsg("");
    try {
      const r = await sendEmails(codigos);
      if (!r.mailConfigured) {
        setEmailMsg("SMTP não configurado — defina as variáveis SMTP_* no Vercel.");
      } else {
        const partes = [`${r.sent} enviado(s)`];
        if (r.already) partes.push(`${r.already} já enviados (não reenviados)`);
        if (r.noEmail) partes.push(`${r.noEmail} sem e-mail`);
        if (r.failed) partes.push(`${r.failed} falharam`);
        setEmailMsg(partes.join(" · "));
      }
      setSelected(new Set());
    } catch (e) {
      setEmailMsg(e instanceof Error ? e.message : "Falha ao enviar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="mb-[18px] flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-display text-[18px] font-bold text-ink">
            Rastreamentos
          </h3>
          <p className="mt-1 text-[13px] text-muted">
            {orders.length} pedido(s) · {active} ativo(s)
          </p>
        </div>
        <div className="flex items-center gap-[9px] rounded-[11px] border-[1.5px] border-field bg-white px-[14px] py-[10px] sm:w-[280px]">
          <Search size={16} color="#9A8FB0" className="flex-none" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por cliente, CPF ou código…"
            className="w-full bg-transparent text-[13px] text-ink outline-none"
          />
        </div>
      </div>

      {/* Ações em massa */}
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <button
          onClick={enviarEmails}
          disabled={busy || selected.size === 0}
          className="flex items-center gap-2 rounded-[10px] bg-brand-mid px-[14px] py-[9px] text-[13px] font-bold text-white disabled:opacity-40"
        >
          <Mail size={15} color="#fff" /> Enviar e-mail ({selected.size})
        </button>
        <button
          onClick={apagarSelecionados}
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
        {selected.size > 0 && (
          <button
            onClick={() => setSelected(new Set())}
            className="text-[13px] font-semibold text-faint"
          >
            Limpar seleção
          </button>
        )}
        {emailMsg && (
          <span className="text-[13px] font-medium text-brand">{emailMsg}</span>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-white">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13.5px]">
            <thead>
              <tr className="bg-brand-wash">
                {COLUMNS.map((c, i) => (
                  <th
                    key={i}
                    className={`whitespace-nowrap px-[16px] py-[14px] text-[11.5px] font-bold uppercase tracking-[0.04em] text-brand-mid ${
                      c === "Ações" ? "text-right" : "text-left"
                    }`}
                  >
                    {i === 0 ? (
                      <input
                        type="checkbox"
                        aria-label="Selecionar todos"
                        checked={allShownSelected}
                        onChange={toggleAllShown}
                        className="h-4 w-4 accent-[#7B2FBE]"
                      />
                    ) : (
                      c
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => {
                const label = currentStatusLabel(o);
                const badge = statusBadge(label);
                const isSel = selected.has(o.codigo);
                return (
                  <tr
                    key={o.codigo}
                    className={`border-t border-[#F1ECF8] ${isSel ? "bg-brand-tint/40" : ""}`}
                  >
                    <td className="px-[16px] py-[15px]">
                      <input
                        type="checkbox"
                        aria-label={`Selecionar ${o.codigo}`}
                        checked={isSel}
                        onChange={() => toggle(o.codigo)}
                        className="h-4 w-4 accent-[#7B2FBE]"
                      />
                    </td>
                    <td className="whitespace-nowrap px-[16px] py-[15px] tabular-nums text-ink">
                      {o.cpf || "—"}
                    </td>
                    <td className="whitespace-nowrap px-[16px] py-[15px] font-semibold text-ink">
                      {o.cliente}
                    </td>
                    <td className="whitespace-nowrap px-[16px] py-[15px]">
                      <div className="font-semibold text-brand">{o.codigo}</div>
                      {o.pedidoRef && o.pedidoRef !== o.codigo && (
                        <div className="text-[11.5px] text-faint">
                          pedido {o.pedidoRef}
                        </div>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-[16px] py-[15px] text-ink">
                      {[o.cidade, o.uf].filter(Boolean).join(" / ") || "—"}
                    </td>
                    <td className="px-[16px] py-[15px]">
                      <span
                        className="whitespace-nowrap rounded-full px-[11px] py-[5px] text-[12px] font-bold"
                        style={{ background: badge.bg, color: badge.fg }}
                      >
                        {label}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-[16px] py-[15px]">
                      {o.emailEnviadoEm ? (
                        <span
                          title={new Date(o.emailEnviadoEm).toLocaleString("pt-BR")}
                          className="inline-flex items-center gap-1 rounded-full bg-[#D8F5E3] px-[9px] py-[4px] text-[11.5px] font-bold text-[#1F8A5B]"
                        >
                          <Check size={12} color="#1F8A5B" strokeWidth={3} /> enviado
                        </span>
                      ) : !o.email ? (
                        <span className="text-[12px] text-faint">sem e-mail</span>
                      ) : (
                        <span className="text-[12px] text-muted">não enviado</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-[16px] py-[15px] text-muted">
                      {o.data || "—"}
                    </td>
                    <td className="whitespace-nowrap px-[16px] py-[15px] text-right">
                      <Link
                        to={`/rastrear?codigo=${encodeURIComponent(o.codigo)}`}
                        className="font-bold text-brand-mid no-underline"
                      >
                        Ver
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr className="border-t border-[#F1ECF8]">
                  <td
                    colSpan={COLUMNS.length}
                    className="px-[18px] py-10 text-center text-[13.5px] text-muted"
                  >
                    {loading ? "Carregando pedidos…" : "Nenhum rastreamento encontrado."}
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
