import { useMemo, useState } from "react";
import { useAdmin } from "@/lib/admin-store";
import type { Order } from "@/lib/types";
import { pago, aNotificar, orderDay, exportCsv } from "@/lib/pedido-helpers";
import { Calendar, Download, Package, Mail } from "@/components/icons";

function formatDayLabel(day: string): string {
  if (!day) return "Sem data";
  const [y, m, d] = day.split("-");
  if (!y || !m || !d) return day;
  return `${d}/${m}/${y}`;
}

interface DayGroup {
  day: string;
  label: string;
  orders: Order[];
  ios: Order[];
  android: Order[];
  aNotificar: Order[];
}

export default function PorDiaTab() {
  const { orders, loading, sendEmails } = useAdmin();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const groups = useMemo<DayGroup[]>(() => {
    const paidOrders = orders.filter(pago);
    const map = new Map<string, Order[]>();
    for (const o of paidOrders) {
      const day = orderDay(o) || "sem-data";
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(o);
    }
    return [...map.entries()]
      .sort((a, b) => b[0].localeCompare(a[0])) // dia mais recente primeiro
      .map(([day, rows]) => ({
        day,
        label: formatDayLabel(day),
        orders: rows,
        ios: rows.filter((o) => o.plataforma === "iOS"),
        android: rows.filter((o) => o.plataforma === "Android"),
        aNotificar: rows.filter(aNotificar),
      }));
  }, [orders]);

  /** Envia o e-mail de "pedido postado" para os pagos do dia — nunca reenvia. */
  async function enviarDia(g: DayGroup) {
    if (!g.aNotificar.length) return;
    setBusy(true);
    setMsg("");
    try {
      const r = await sendEmails(g.aNotificar.map((o) => o.codigo));
      if (!r.mailConfigured) setMsg(`Dia ${g.label}: SMTP não configurado.`);
      else {
        const p = [`${r.sent} enviado(s)`];
        if (r.already) p.push(`${r.already} já enviados`);
        if (r.naoPago) p.push(`${r.naoPago} não pago(s)`);
        if (r.noEmail) p.push(`${r.noEmail} sem e-mail`);
        setMsg(`Dia ${g.label}: ${p.join(" · ")}`);
      }
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Falha ao enviar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="mb-5">
        <h3 className="font-display text-[18px] font-bold text-ink">Pedidos por dia</h3>
        <p className="mt-1 text-[13px] text-muted">
          Pedidos PAGOS separados pelo dia do pedido, prontos pra envio. Envie o
          e-mail de postagem por dia, ou baixe tudo (ou só iOS/Android) daquele dia.
        </p>
      </div>

      {loading && <p className="text-[13px] text-muted">Carregando…</p>}
      {!loading && groups.length === 0 && (
        <p className="text-[13px] text-muted">Nenhum pedido pago ainda.</p>
      )}
      {msg && <p className="mb-4 text-[13px] font-medium text-brand">{msg}</p>}

      <div className="flex flex-col gap-4">
        {groups.map((g) => (
          <div key={g.day} className="rounded-2xl border border-line bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-tint">
                  <Calendar size={18} color="#7B2FBE" />
                </span>
                <div>
                  <div className="font-display text-[16px] font-bold text-ink">
                    Dia {g.label} · para envio
                  </div>
                  <div className="text-[12.5px] text-muted">
                    {g.orders.length} pedido(s) pago(s)
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => enviarDia(g)}
                  disabled={busy || g.aNotificar.length === 0}
                  className="flex items-center gap-2 rounded-[10px] bg-[#C2410C] px-[14px] py-[9px] text-[13px] font-bold text-white disabled:opacity-40"
                >
                  <Mail size={15} color="#fff" /> Enviar e-mail do dia ({g.aNotificar.length})
                </button>
                <button
                  onClick={() =>
                    exportCsv(g.orders, `pedidos-pagos-${g.day}.csv`)
                  }
                  className="flex items-center gap-2 rounded-[10px] bg-brand-mid px-[14px] py-[9px] text-[13px] font-bold text-white"
                >
                  <Package size={15} color="#fff" /> Baixar todos do dia ({g.orders.length})
                </button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-3 border-t border-[#F1ECF8] pt-4">
              <button
                onClick={() =>
                  exportCsv(g.ios, `pedidos-pagos-ios-${g.day}.csv`)
                }
                disabled={g.ios.length === 0}
                className="flex items-center gap-2 rounded-[10px] border-[1.5px] border-field bg-white px-[14px] py-[9px] text-[13px] font-bold text-ink disabled:opacity-40"
              >
                <Download size={15} color="#111827" /> Baixar iOS do dia {g.label} ({g.ios.length})
              </button>
              <button
                onClick={() =>
                  exportCsv(g.android, `pedidos-pagos-android-${g.day}.csv`)
                }
                disabled={g.android.length === 0}
                className="flex items-center gap-2 rounded-[10px] border-[1.5px] border-field bg-white px-[14px] py-[9px] text-[13px] font-bold text-[#1F8A5B] disabled:opacity-40"
              >
                <Download size={15} color="#1F8A5B" /> Baixar Android do dia {g.label} ({g.android.length})
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
