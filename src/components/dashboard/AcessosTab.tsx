import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { Lookup } from "@/lib/types";
import { useAdmin } from "@/lib/admin-store";
import { Smartphone, Monitor, Search, Check, Info } from "@/components/icons";

const COLUMNS = ["Quando", "Dispositivo", "Sistema", "Navegador", "Consulta", "Pedido / Cliente", "CPF", "IP"];

const isDesktopOs = (l: Lookup) => /windows|mac|linux/i.test(l.os || "");
const isAndroid = (l: Lookup) => /android/i.test(l.os || l.device || "");
const isIos = (l: Lookup) =>
  /ios|ipados|iphone|ipad/i.test((l.os || "") + " " + (l.device || ""));

const FILTERS: Array<{ key: string; label: string; test: (l: Lookup) => boolean }> = [
  { key: "todos", label: "Todos", test: () => true },
  { key: "android", label: "Android", test: isAndroid },
  { key: "ios", label: "iOS (iPhone)", test: isIos },
  { key: "desktop", label: "Computador", test: isDesktopOs },
  { key: "found", label: "Encontradas", test: (l) => !!l.found },
  { key: "notfound", label: "Não encontradas", test: (l) => !l.found },
];

function when(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "—" : d.toLocaleString("pt-BR");
}

export default function AcessosTab() {
  const { lookups, loading, orders } = useAdmin();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("todos");

  // mapa código -> pedido, pra mostrar o CPF e linkar aos detalhes
  const orderByCode = useMemo(() => {
    const m = new Map<string, (typeof orders)[number]>();
    for (const o of orders) m.set(o.codigo, o);
    return m;
  }, [orders]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const test = FILTERS.find((f) => f.key === filter)?.test ?? (() => true);
    return lookups.filter((l) => {
      if (!test(l)) return false;
      if (!q) return true;
      return [l.query, l.codigo, l.cliente, l.ip, l.device, l.os, l.browser]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [lookups, query, filter]);

  const stats = useMemo(() => {
    const total = lookups.length;
    const found = lookups.filter((l) => l.found).length;
    const brands = new Map<string, number>();
    for (const l of lookups) {
      const b = l.brand || "Desconhecido";
      brands.set(b, (brands.get(b) ?? 0) + 1);
    }
    const topBrand =
      [...brands.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
    return { total, found, notFound: total - found, topBrand };
  }, [lookups]);

  const cards = [
    { icon: Search, label: "Consultas", value: stats.total, tint: "#7B2FBE" },
    { icon: Check, label: "Encontradas", value: stats.found, tint: "#1F8A5B" },
    { icon: Info, label: "Não encontradas", value: stats.notFound, tint: "#C2410C" },
    { icon: Smartphone, label: "Marca mais comum", value: stats.topBrand, tint: "#6B23B0" },
  ];

  return (
    <div>
      <div className="mb-5">
        <h3 className="font-display text-[18px] font-bold text-ink">Acessos</h3>
        <p className="mt-1 text-[13px] text-muted">
          Cada consulta feita no rastreio público, com o dispositivo de quem
          pesquisou.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map(({ icon: Icon, label, value, tint }) => (
          <div key={label} className="rounded-2xl border border-line bg-white p-[18px]">
            <span
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: `${tint}1A` }}
            >
              <Icon size={20} color={tint} />
            </span>
            <div className="mt-3 font-display text-[24px] font-extrabold text-ink">
              {value}
            </div>
            <div className="text-[12.5px] text-muted">{label}</div>
          </div>
        ))}
      </div>

      {/* Busca + filtros */}
      <div className="mt-6 flex flex-col gap-3">
        <div className="flex items-center gap-[9px] rounded-[11px] border-[1.5px] border-field bg-white px-[14px] py-[10px] sm:max-w-[360px]">
          <Search size={16} color="#9A8FB0" className="flex-none" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por CPF, código, nº do pedido, cliente ou IP…"
            className="w-full bg-transparent text-[13px] text-ink outline-none"
          />
        </div>
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
      </div>

      {/* Lookups table */}
      <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-white">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13.5px]">
            <thead>
              <tr className="bg-brand-wash">
                {COLUMNS.map((c) => (
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
              {filtered.map((l) => (
                <tr key={l.id} className="border-t border-[#F1ECF8]">
                  <td className="whitespace-nowrap px-[16px] py-[13px] text-muted">
                    {when(l.createdAt)}
                  </td>
                  <td className="whitespace-nowrap px-[16px] py-[13px]">
                    <span className="flex items-center gap-2 font-semibold text-ink">
                      {isDesktopOs(l) ? (
                        <Monitor size={16} color="#7B2FBE" />
                      ) : (
                        <Smartphone size={16} color="#7B2FBE" />
                      )}
                      {l.device || "—"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-[16px] py-[13px] text-ink">
                    {l.os || "—"}
                  </td>
                  <td className="whitespace-nowrap px-[16px] py-[13px] text-muted">
                    {l.browser || "—"}
                  </td>
                  <td className="whitespace-nowrap px-[16px] py-[13px] font-semibold text-muted">
                    {l.query || "—"}
                  </td>
                  <td className="px-[16px] py-[13px]">
                    {l.found && l.codigo ? (
                      <span>
                        <Link
                          to={`/rastrear?codigo=${encodeURIComponent(l.codigo)}`}
                          target="_blank"
                          className="font-semibold text-brand-mid no-underline hover:underline"
                        >
                          {l.codigo} ↗
                        </Link>
                        {l.cliente ? (
                          <span className="block text-[12px] text-muted">
                            {l.cliente}
                          </span>
                        ) : null}
                      </span>
                    ) : (
                      <span className="whitespace-nowrap rounded-full bg-[#FBE7D6] px-[10px] py-[3px] text-[11.5px] font-bold text-[#C2410C]">
                        não encontrado
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-[16px] py-[13px] tabular-nums text-ink">
                    {(l.codigo && orderByCode.get(l.codigo)?.cpf) || "—"}
                  </td>
                  <td className="whitespace-nowrap px-[16px] py-[13px] tabular-nums text-faint">
                    {l.ip || "—"}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr className="border-t border-[#F1ECF8]">
                  <td
                    colSpan={COLUMNS.length}
                    className="px-4 py-10 text-center text-[13.5px] text-muted"
                  >
                    {loading
                      ? "Carregando…"
                      : lookups.length === 0
                        ? "Nenhuma consulta registrada ainda. Assim que alguém rastrear um pedido, o dispositivo aparece aqui."
                        : "Nenhum acesso para essa busca/filtro."}
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
