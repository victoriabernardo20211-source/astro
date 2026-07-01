import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAdmin } from "@/lib/admin-store";
import { statusBadge, statusIndex, currentStatusLabel } from "@/lib/data";
import type { Order } from "@/lib/types";
import { Package, Truck, MapPin, Check } from "@/components/icons";

/** Groups the 8 canonical stages into 4 coarse buckets used for filtering. */
function bucket(order: Order): "preparacao" | "transporte" | "entrega" | "entregue" {
  const i = statusIndex(currentStatusLabel(order));
  if (i <= 1) return "preparacao";
  if (i <= 5) return "transporte";
  if (i === 6) return "entrega";
  return "entregue";
}

const FILTERS = [
  { key: "todos", label: "Todos" },
  { key: "preparacao", label: "Em preparação" },
  { key: "transporte", label: "Em transporte" },
  { key: "entrega", label: "Saiu para entrega" },
  { key: "entregue", label: "Entregues" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

export default function PedidosLpqvTab() {
  const { orders } = useAdmin();
  const [filter, setFilter] = useState<FilterKey>("todos");

  const stats = useMemo(() => {
    const counts = { preparacao: 0, transporte: 0, entrega: 0, entregue: 0 };
    for (const o of orders) counts[bucket(o)]++;
    return counts;
  }, [orders]);

  const cards = [
    { icon: Package, label: "Total de pedidos", value: orders.length, tint: "#7B2FBE" },
    { icon: Truck, label: "Em transporte", value: stats.transporte, tint: "#6B23B0" },
    { icon: MapPin, label: "Saiu para entrega", value: stats.entrega, tint: "#C2410C" },
    { icon: Check, label: "Entregues", value: stats.entregue, tint: "#1F8A5B" },
  ];

  const filtered = useMemo(
    () => (filter === "todos" ? orders : orders.filter((o) => bucket(o) === filter)),
    [orders, filter]
  );

  return (
    <div>
      <div className="mb-5">
        <h3 className="font-display text-[18px] font-bold text-ink">Pedidos LPQV</h3>
        <p className="mt-1 text-[13px] text-muted">
          Visão consolidada dos pedidos vinculados à conta LPQV.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map(({ icon: Icon, label, value, tint }) => (
          <div
            key={label}
            className="rounded-2xl border border-line bg-white p-[18px]"
          >
            <span
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: `${tint}1A` }}
            >
              <Icon size={20} color={tint} />
            </span>
            <div className="mt-3 font-display text-[28px] font-extrabold text-ink">
              {value}
            </div>
            <div className="text-[12.5px] text-muted">{label}</div>
          </div>
        ))}
      </div>

      {/* Filter chips */}
      <div className="mt-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const active = f.key === filter;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-full px-[15px] py-[8px] text-[13px] font-semibold transition-colors ${
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

      {/* Orders list */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {filtered.map((o) => {
          const label = currentStatusLabel(o);
          const badge = statusBadge(label);
          return (
            <div
              key={o.codigo}
              className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-[18px]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-display text-[15px] font-bold text-ink">
                    {o.cliente}
                  </div>
                  <div className="mt-[2px] text-[12.5px] font-semibold text-muted">
                    {o.codigo}
                  </div>
                </div>
                <span
                  className="whitespace-nowrap rounded-full px-[11px] py-[5px] text-[11.5px] font-bold"
                  style={{ background: badge.bg, color: badge.fg }}
                >
                  {label}
                </span>
              </div>
              <div className="flex items-center gap-[6px] text-[13px] text-ink">
                <MapPin size={15} color="#9A8FB0" className="flex-none" />
                {o.origem || "Origem"} <span className="text-faint">→</span>{" "}
                {[o.cidade, o.uf].filter(Boolean).join(" / ") || "destino"}
              </div>
              <div className="flex items-center justify-between border-t border-[#F1ECF8] pt-3">
                <span className="text-[12.5px] text-muted">
                  {o.previsao ? `Previsão: ${o.previsao}` : o.data || ""}
                </span>
                <Link
                  to={`/rastrear?codigo=${encodeURIComponent(o.codigo)}`}
                  className="text-[13px] font-bold text-brand-mid no-underline"
                >
                  Rastrear →
                </Link>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-field bg-white py-12 text-center text-[13.5px] text-muted">
            Nenhum pedido neste filtro.
          </div>
        )}
      </div>
    </div>
  );
}
