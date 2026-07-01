import { useMemo } from "react";
import { useAdmin } from "@/lib/admin-store";
import { Smartphone, Monitor, Search, Check, Info } from "@/components/icons";

const COLUMNS = ["Quando", "Dispositivo", "Sistema", "Navegador", "Consulta", "Pedido", "IP"];

function when(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "—" : d.toLocaleString("pt-BR");
}

export default function AcessosTab() {
  const { lookups, loading } = useAdmin();

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

  const isDesktop = (l: { os?: string | null }) =>
    /windows|mac|linux/i.test(l.os || "");

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

      {/* Lookups table */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-white">
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
              {lookups.map((l) => (
                <tr key={l.id} className="border-t border-[#F1ECF8]">
                  <td className="whitespace-nowrap px-[16px] py-[13px] text-muted">
                    {when(l.createdAt)}
                  </td>
                  <td className="whitespace-nowrap px-[16px] py-[13px]">
                    <span className="flex items-center gap-2 font-semibold text-ink">
                      {isDesktop(l) ? (
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
                    {l.found ? (
                      <span className="text-ink">
                        <span className="font-semibold">{l.codigo}</span>
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
                  <td className="whitespace-nowrap px-[16px] py-[13px] tabular-nums text-faint">
                    {l.ip || "—"}
                  </td>
                </tr>
              ))}
              {lookups.length === 0 && (
                <tr className="border-t border-[#F1ECF8]">
                  <td
                    colSpan={COLUMNS.length}
                    className="px-4 py-10 text-center text-[13.5px] text-muted"
                  >
                    {loading
                      ? "Carregando…"
                      : "Nenhuma consulta registrada ainda. Assim que alguém rastrear um pedido, o dispositivo aparece aqui."}
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
