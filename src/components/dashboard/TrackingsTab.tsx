import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAdmin } from "@/lib/admin-store";
import { statusBadge, statusIndex, currentStatusLabel } from "@/lib/data";
import { Search } from "@/components/icons";

const COLUMNS = ["CPF", "Cliente", "Código", "Cidade/UF", "Status", "Data", "Ações"];

export default function TrackingsTab() {
  const { orders, loading } = useAdmin();
  const [query, setQuery] = useState("");

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

  return (
    <div>
      <div className="mb-[18px] flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-display text-[18px] font-bold text-ink">
            Rastreamentos
          </h3>
          <p className="mt-1 text-[13px] text-muted">
            {active} {active === 1 ? "pedido ativo" : "pedidos ativos"} no momento
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

      <div className="overflow-hidden rounded-2xl border border-line bg-white">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13.5px]">
            <thead>
              <tr className="bg-brand-wash">
                {COLUMNS.map((c) => (
                  <th
                    key={c}
                    className={`whitespace-nowrap px-[18px] py-[14px] text-[11.5px] font-bold uppercase tracking-[0.04em] text-brand-mid ${
                      c === "Ações" ? "text-right" : "text-left"
                    }`}
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
                return (
                  <tr key={o.codigo} className="border-t border-[#F1ECF8]">
                    <td className="whitespace-nowrap px-[18px] py-[15px] tabular-nums text-ink">
                      {o.cpf || "—"}
                    </td>
                    <td className="whitespace-nowrap px-[18px] py-[15px] font-semibold text-ink">
                      {o.cliente}
                    </td>
                    <td className="whitespace-nowrap px-[18px] py-[15px]">
                      <div className="font-semibold text-brand">{o.codigo}</div>
                      {o.pedidoRef && o.pedidoRef !== o.codigo && (
                        <div className="text-[11.5px] text-faint">
                          pedido {o.pedidoRef}
                        </div>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-[18px] py-[15px] text-ink">
                      {[o.cidade, o.uf].filter(Boolean).join(" / ") || "—"}
                    </td>
                    <td className="px-[18px] py-[15px]">
                      <span
                        className="whitespace-nowrap rounded-full px-[11px] py-[5px] text-[12px] font-bold"
                        style={{ background: badge.bg, color: badge.fg }}
                      >
                        {label}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-[18px] py-[15px] text-muted">
                      {o.data || "—"}
                    </td>
                    <td className="whitespace-nowrap px-[18px] py-[15px] text-right">
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
