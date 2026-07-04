import { useEffect, useState } from "react";
import type { PresenceData } from "@/lib/api";
import { fetchPresence } from "@/lib/api";
import { Smartphone, Monitor } from "@/components/icons";

const COLUMNS = ["Dispositivo", "Sistema", "Página", "Entrou", "Visto", "IP"];

function pageLabel(path?: string | null): string {
  if (!path) return "—";
  if (path === "/" || path === "") return "Página inicial";
  if (path.startsWith("/rastrear")) return "Rastreio";
  return path;
}

function ago(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso).getTime();
  if (isNaN(d)) return "—";
  const s = Math.max(0, Math.round((Date.now() - d) / 1000));
  if (s < 60) return `há ${s}s`;
  const m = Math.round(s / 60);
  return `há ${m} min`;
}

function timeOf(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? "—"
    : d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

const isDesktop = (os?: string | null) => /windows|mac|linux/i.test(os || "");

export default function AoVivoTab() {
  const [data, setData] = useState<PresenceData>({ online: 0, visitors: [] });
  const [loading, setLoading] = useState(true);
  const [, setTick] = useState(0);

  useEffect(() => {
    let active = true;
    const load = () =>
      fetchPresence()
        .then((d) => active && setData(d))
        .catch(() => {})
        .finally(() => active && setLoading(false));
    load();
    const poll = setInterval(load, 8_000);
    // re-render p/ atualizar os "há Xs"
    const tick = setInterval(() => active && setTick((t) => t + 1), 5_000);
    return () => {
      active = false;
      clearInterval(poll);
      clearInterval(tick);
    };
  }, []);

  return (
    <div>
      <div className="mb-5">
        <h3 className="font-display text-[18px] font-bold text-ink">Ao vivo</h3>
        <p className="mt-1 text-[13px] text-muted">
          Pessoas navegando no site agora (atualiza sozinho).
        </p>
      </div>

      {/* Contador */}
      <div className="mb-6 flex items-center gap-4 rounded-2xl border border-line bg-white p-5">
        <span className="relative flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#1F8A5B] opacity-60" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-[#1F8A5B]" />
        </span>
        <div>
          <div className="font-display text-[34px] font-extrabold leading-none text-ink">
            {data.online}
          </div>
          <div className="text-[13px] text-muted">
            {data.online === 1 ? "pessoa online agora" : "pessoas online agora"}
          </div>
        </div>
      </div>

      {/* Lista */}
      <div className="overflow-hidden rounded-2xl border border-line bg-white">
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
              {data.visitors.map((v) => (
                <tr key={v.id} className="border-t border-[#F1ECF8]">
                  <td className="whitespace-nowrap px-[16px] py-[13px]">
                    <span className="flex items-center gap-2 font-semibold text-ink">
                      {isDesktop(v.os) ? (
                        <Monitor size={16} color="#7B2FBE" />
                      ) : (
                        <Smartphone size={16} color="#7B2FBE" />
                      )}
                      {v.device || "—"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-[16px] py-[13px] text-ink">
                    {v.os || "—"}
                  </td>
                  <td className="whitespace-nowrap px-[16px] py-[13px] text-muted">
                    {pageLabel(v.path)}
                  </td>
                  <td className="whitespace-nowrap px-[16px] py-[13px] text-muted">
                    {timeOf(v.firstSeen)}
                  </td>
                  <td className="whitespace-nowrap px-[16px] py-[13px] font-semibold text-[#1F8A5B]">
                    {ago(v.lastSeen)}
                  </td>
                  <td className="whitespace-nowrap px-[16px] py-[13px] tabular-nums text-faint">
                    {v.ip || "—"}
                  </td>
                </tr>
              ))}
              {data.visitors.length === 0 && (
                <tr className="border-t border-[#F1ECF8]">
                  <td
                    colSpan={COLUMNS.length}
                    className="px-4 py-10 text-center text-[13.5px] text-muted"
                  >
                    {loading ? "Carregando…" : "Ninguém navegando no momento."}
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
