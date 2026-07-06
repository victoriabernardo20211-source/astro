import type { Order } from "@/lib/types";
import {
  buildTimeline,
  currentStatusLabel,
  estimatedDelivery,
  cleanOrigem,
} from "@/lib/data";
import Timeline from "./Timeline";
import TrackSearch from "./TrackSearch";
import { Truck, Chat, MapPin, Package } from "./icons";

export default function TrackingResult({ order }: { order: Order }) {
  const steps = buildTimeline(order);
  const statusAtual = currentStatusLabel(order);
  const previsao = estimatedDelivery(order);
  const destino = [order.cidade, order.uf].filter(Boolean).join(" / ") || "—";

  const enderecoLinha = [
    [order.endereco, order.numero].filter(Boolean).join(", "),
    order.complemento,
    order.bairro,
  ]
    .filter(Boolean)
    .join(" · ");

  const details: Array<[string, string]> = [
    ["Destinatário", order.cliente],
    ["Código", order.codigo],
    order.pedidoRef ? ["Nº do pedido", order.pedidoRef] : null,
    order.transportadora ? ["Transportadora", order.transportadora] : null,
    ["Origem", cleanOrigem(order.origem || "") || "Centro de distribuição"],
    ["Destino", destino],
    order.tipoFrete ? ["Frete", order.tipoFrete] : null,
    order.valorTotal ? ["Total", `R$ ${order.valorTotal}`] : null,
  ].filter(Boolean) as Array<[string, string]>;

  return (
    <>
      {/* Restated search band */}
      <section className="flex flex-col items-start justify-between gap-4 bg-brand px-6 py-[26px] sm:flex-row sm:items-center lg:px-12">
        <div>
          <div className="text-[12.5px] font-medium text-[#C9B8E8]">
            Resultado para o código
          </div>
          <div className="mt-[2px] font-display text-[24px] font-extrabold tracking-[0.01em] text-white">
            {order.codigo}
          </div>
        </div>
        <TrackSearch variant="compact" />
      </section>

      {/* Body */}
      <div className="grid gap-7 px-6 pb-14 pt-9 lg:grid-cols-[1fr_360px] lg:px-12">
        {/* Left: status + timeline */}
        <div className="flex flex-col gap-6">
          {/* Current status banner */}
          <div className="flex flex-col items-start gap-5 rounded-[18px] border border-line bg-white p-7 shadow-card sm:flex-row sm:items-center sm:gap-[22px]">
            <span className="nb-pulse-slow flex h-16 w-16 flex-none items-center justify-center rounded-[18px] bg-brand-tint">
              <Truck size={30} color="#7B2FBE" />
            </span>
            <div className="flex-1">
              <div className="text-xs font-bold uppercase tracking-[0.05em] text-brand-mid">
                Status atual
              </div>
              <div className="mt-[3px] font-display text-[24px] font-extrabold text-ink">
                {statusAtual}
              </div>
              <div className="mt-1 text-[14px] text-muted">
                {`Acompanhe o status da entrega para ${destino}.`}
              </div>
              {order.transportadora && (
                <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-brand-tint px-[12px] py-[5px] text-[12.5px] font-semibold text-brand">
                  <Truck size={14} color="#7B2FBE" />
                  Entrega realizada pela {order.transportadora}
                </div>
              )}
            </div>
            {previsao && (
              <div className="flex-none text-left sm:text-right">
                <div className="text-xs font-semibold text-faint">
                  Previsão de entrega
                </div>
                <div className="mt-[2px] font-display text-[20px] font-extrabold text-brand">
                  {previsao}
                </div>
              </div>
            )}
          </div>

          {/* Timeline card */}
          <div className="rounded-[18px] border border-line bg-white p-[30px] shadow-card">
            <h2 className="font-display text-[18px] font-bold text-ink">
              Histórico de movimentação
            </h2>
            <p className="mb-[22px] mt-1 text-[12.5px] text-faint">
              Datas estimadas conforme o prazo de entrega.
            </p>
            <Timeline steps={steps} />
          </div>
        </div>

        {/* Right: product + details + address + help */}
        <div className="flex flex-col gap-5">
          {order.produto && (
            <div className="flex gap-4 rounded-[18px] border border-line bg-white p-[18px] shadow-card">
              {order.produtoFoto ? (
                <img
                  src={order.produtoFoto}
                  alt={order.produto}
                  loading="lazy"
                  className="h-[68px] w-[68px] flex-none rounded-xl border border-line object-cover"
                />
              ) : (
                <span className="flex h-[68px] w-[68px] flex-none items-center justify-center rounded-xl bg-brand-tint">
                  <Package size={26} color="#7B2FBE" />
                </span>
              )}
              <div className="min-w-0">
                <div className="text-[11.5px] font-bold uppercase tracking-[0.04em] text-brand-mid">
                  Produto
                </div>
                <div className="mt-1 text-[13.5px] font-semibold leading-snug text-ink">
                  {order.produto}
                </div>
                {order.qtde ? (
                  <div className="mt-1 text-[12.5px] text-muted">
                    Qtde: {order.qtde}
                  </div>
                ) : null}
              </div>
            </div>
          )}

          {enderecoLinha && (
            <div className="rounded-[18px] border border-line bg-white p-[22px] shadow-card">
              <div className="flex items-center gap-2">
                <MapPin size={16} color="#7B2FBE" />
                <h3 className="font-display text-[15px] font-bold text-ink">
                  Endereço de entrega
                </h3>
              </div>
              <p className="mt-2 text-[13.5px] leading-[1.55] text-muted">
                {enderecoLinha}
                {order.cep ? (
                  <>
                    <br />
                    {destino} · CEP {order.cep}
                  </>
                ) : (
                  <>
                    <br />
                    {destino}
                  </>
                )}
              </p>
            </div>
          )}

          <div className="rounded-[18px] border border-line bg-white p-[26px] shadow-card">
            <h3 className="mb-[18px] font-display text-[16px] font-bold text-ink">
              Detalhes da encomenda
            </h3>
            <div className="flex flex-col gap-[15px]">
              {details.map(([label, value], i) => (
                <div
                  key={label}
                  className={`flex justify-between gap-3 ${
                    i > 0 ? "border-t border-[#F1ECF8] pt-[15px]" : ""
                  }`}
                >
                  <span className="text-[13.5px] font-semibold text-faint">
                    {label}
                  </span>
                  <span className="text-right text-[13.5px] font-bold text-ink">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[18px] border border-brand-lavender bg-brand-tint p-[26px] text-center">
            <div className="mx-auto flex h-[50px] w-[50px] items-center justify-center rounded-full bg-white shadow-[0_4px_14px_rgba(74,14,143,0.10)]">
              <Chat size={24} color="#7B2FBE" />
            </div>
            <h3 className="mt-[14px] font-display text-[16px] font-bold text-ink">
              Algo errado com a entrega?
            </h3>
            <button className="mt-4 w-full rounded-xl bg-brand-mid p-[13px] text-[14px] font-bold text-white">
              Falar com Atendimento
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
