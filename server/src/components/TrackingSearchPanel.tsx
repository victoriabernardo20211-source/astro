import TrackSearch from "./TrackSearch";
import { Info, Chat } from "./icons";

const STEPS = [
  {
    n: "1",
    title: "Digite no campo acima",
    desc: 'Insira o código completo no campo de busca e clique em "Rastrear" para consultar.',
  },
  {
    n: "2",
    title: "Acompanhe em tempo real",
    desc: "Visualize cada etapa da entrega: coleta, trânsito, chegada no centro de distribuição e entrega final.",
  },
];

/** The search + "how it works" + help layout (frame 6). */
export default function TrackingSearchPanel({
  notFound,
}: {
  notFound?: string;
}) {
  return (
    <div className="grid items-start gap-7 px-6 pb-14 pt-11 lg:grid-cols-[1fr_340px] lg:px-12">
      {/* Left column */}
      <div className="flex flex-col gap-6">
        {/* Search card */}
        <div className="rounded-[18px] border border-line bg-white p-7 shadow-card">
          <label className="mb-[10px] block text-[13px] font-bold text-ink">
            Código de rastreio
          </label>
          <TrackSearch variant="page" placeholder="Digite seu código" />
          {notFound && (
            <div className="mt-4 flex items-start gap-3 rounded-xl border border-[#F3C9C9] bg-[#FDF1F1] px-4 py-3 text-[13.5px] leading-[1.5] text-[#A23B3B]">
              <Info size={17} color="#C2410C" className="mt-[1px] flex-none" />
              <span>
                Nenhuma encomenda encontrada para{" "}
                <strong>{notFound}</strong>. Confira o código e tente novamente.
              </span>
            </div>
          )}
        </div>

        {/* How it works */}
        <div className="rounded-[18px] border border-line bg-white p-[30px] shadow-card">
          <h2 className="mb-[18px] font-display text-[20px] font-bold text-ink">
            Como funciona o rastreamento?
          </h2>
          <div className="flex flex-col gap-[22px] border-t border-[#F1ECF8] pt-[22px]">
            {STEPS.map((s) => (
              <div key={s.n} className="flex items-start gap-4">
                <div className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-brand-mid font-display text-sm font-bold text-white">
                  {s.n}
                </div>
                <div>
                  <div className="font-display text-[16px] font-bold text-ink">
                    {s.title}
                  </div>
                  <div className="mt-[5px] text-[14px] leading-[1.55] text-muted">
                    {s.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex items-start gap-3 rounded-r-xl border-l-[3px] border-brand-mid bg-brand-tint px-[18px] py-4">
            <Info size={18} color="#7B2FBE" className="mt-[1px] flex-none" />
            <div className="text-[13.5px] leading-[1.55] text-[#5A4D72]">
              As informações de rastreamento são atualizadas a cada movimentação
              da encomenda. Pode haver um pequeno atraso entre a movimentação
              física e a atualização no sistema.
            </div>
          </div>
        </div>
      </div>

      {/* Right column — help */}
      <div className="rounded-[18px] border border-brand-lavender bg-brand-tint p-[30px] text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-[0_4px_14px_rgba(74,14,143,0.10)]">
          <Chat size={26} color="#7B2FBE" />
        </div>
        <h3 className="mt-[18px] font-display text-[18px] font-bold text-ink">
          Precisa de ajuda?
        </h3>
        <p className="mt-[9px] text-[13.5px] leading-[1.55] text-muted">
          Problemas com sua entrega ou o código não funciona?
        </p>
        <button className="mt-[22px] w-full rounded-xl border-[1.5px] border-brand-mid bg-transparent p-[14px] text-[14px] font-bold text-brand">
          Falar com Atendimento
        </button>
      </div>
    </div>
  );
}
