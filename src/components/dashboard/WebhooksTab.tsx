import { Fragment, useEffect, useState } from "react";
import type { WebhookEvent } from "@/lib/types";
import { fetchWebhooks } from "@/lib/api";
import { Check, Info, FileText } from "@/components/icons";

function when(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "—" : d.toLocaleString("pt-BR");
}

export default function WebhooksTab() {
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    const load = () =>
      fetchWebhooks()
        .then((d) => active && setEvents(d.events))
        .catch(() => {})
        .finally(() => active && setLoading(false));
    load();
    const t = setInterval(load, 10_000);
    return () => {
      active = false;
      clearInterval(t);
    };
  }, []);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const url = `${origin}/api/webhook/lpqv?key=SUA_CHAVE_SECRETA`;

  return (
    <div>
      <div className="mb-5">
        <h3 className="font-display text-[18px] font-bold text-ink">
          Webhooks (LPQV em tempo real)
        </h3>
        <p className="mt-1 text-[13px] text-muted">
          Recebe os pedidos da LPQV automaticamente, sem CSV. Cada evento fica
          registrado abaixo.
        </p>
      </div>

      {/* Setup */}
      <div className="mb-6 rounded-2xl border border-line bg-white p-5">
        <h4 className="font-display text-[15px] font-bold text-ink">Como configurar</h4>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-[13px] text-muted">
          <li>
            No Vercel, defina a variável <code className="text-brand">WEBHOOK_SECRET</code> com
            uma senha secreta sua (ex.: um código aleatório).
          </li>
          <li>
            Na LPQV → Webhooks → <strong>Cadastrar webhook</strong>, método{" "}
            <strong>Pedidos</strong>, e cole a URL abaixo (troque{" "}
            <code>SUA_CHAVE_SECRETA</code> pela mesma do passo 1):
          </li>
        </ol>
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-field bg-brand-wash px-3 py-2">
          <code className="flex-1 truncate text-[12.5px] text-ink">{url}</code>
          <button
            onClick={() => {
              navigator.clipboard?.writeText(url).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              });
            }}
            className="rounded-lg bg-brand-mid px-3 py-[6px] text-[12px] font-bold text-white"
          >
            {copied ? "Copiado!" : "Copiar"}
          </button>
        </div>
      </div>

      {/* Eventos */}
      <div className="overflow-hidden rounded-2xl border border-line bg-white">
        <table className="w-full border-collapse text-[13.5px]">
          <thead>
            <tr className="bg-brand-wash">
              {["Quando", "Status", "Pedido / Cliente", "Info", ""].map((c) => (
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
            {events.map((e) => (
              <Fragment key={e.id}>
                <tr className="border-t border-[#F1ECF8]">
                  <td className="whitespace-nowrap px-[16px] py-[13px] text-muted">
                    {when(e.createdAt)}
                  </td>
                  <td className="px-[16px] py-[13px]">
                    {e.ok ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#D8F5E3] px-[9px] py-[3px] text-[11.5px] font-bold text-[#1F8A5B]">
                        <Check size={12} color="#1F8A5B" strokeWidth={3} /> ok
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#FBE7D6] px-[9px] py-[3px] text-[11.5px] font-bold text-[#C2410C]">
                        <Info size={12} color="#C2410C" /> revisar
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-[16px] py-[13px] text-ink">
                    {e.codigo ? (
                      <>
                        <span className="font-semibold text-brand">{e.codigo}</span>
                        {e.cliente ? (
                          <span className="block text-[12px] text-muted">{e.cliente}</span>
                        ) : null}
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-[16px] py-[13px] text-[12.5px] text-muted">
                    {e.message || "—"}
                  </td>
                  <td className="whitespace-nowrap px-[16px] py-[13px] text-right">
                    <button
                      onClick={() => setOpenId(openId === e.id ? null : e.id)}
                      className="flex items-center gap-1 text-[12.5px] font-bold text-brand-mid"
                    >
                      <FileText size={13} color="#7B2FBE" />
                      {openId === e.id ? "ocultar" : "ver payload"}
                    </button>
                  </td>
                </tr>
                {openId === e.id && (
                  <tr className="border-t border-[#F1ECF8] bg-[#FBFAFE]">
                    <td colSpan={5} className="px-[16px] py-3">
                      <pre className="max-h-[280px] overflow-auto whitespace-pre-wrap break-all rounded-lg bg-[#1c1830] p-3 text-[11.5px] leading-[1.5] text-[#e6daf6]">
                        {e.raw || "(vazio)"}
                      </pre>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
            {events.length === 0 && (
              <tr className="border-t border-[#F1ECF8]">
                <td colSpan={5} className="px-4 py-10 text-center text-[13.5px] text-muted">
                  {loading
                    ? "Carregando…"
                    : "Nenhum webhook recebido ainda. Configure na LPQV e faça um pedido de teste."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
