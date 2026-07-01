import { Link } from "react-router-dom";
import { BrandHeader } from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PhotoSlot from "@/components/PhotoSlot";
import TrackSearch from "@/components/TrackSearch";
import { Cube, Truck, Warehouse, Refresh, Check } from "@/components/icons";

const STATS = [
  { value: "+20", label: "anos de estrada" },
  { value: "100+", label: "veículos na frota" },
  { value: "26", label: "estados atendidos" },
  { value: "99%", label: "entregas no prazo" },
];

const SERVICES = [
  {
    icon: Cube,
    title: "Carga fracionada",
    desc: "Cargas combinadas por rota, com custo otimizado e segurança total.",
  },
  {
    icon: Truck,
    title: "Carga dedicada",
    desc: "Veículo exclusivo do ponto de coleta direto ao destino final.",
  },
  {
    icon: Warehouse,
    title: "Armazenagem",
    desc: "Paletização e guarda segura, com estrutura para manuseio de cargas.",
  },
  {
    icon: Refresh,
    title: "Coletas & devoluções",
    desc: "Logística reversa ágil para trocas, retornos e redistribuição.",
  },
];

const COMPANY_POINTS = [
  "Frota própria e monitorada por GPS",
  "Rastreamento atualizado em tempo real",
  "Suporte dedicado em todas as etapas",
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white text-ink">
      <BrandHeader />

      {/* Hero */}
      <section className="px-6 pb-14 pt-2 lg:px-11">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2 lg:gap-12">
          <div className="py-6 lg:py-[34px]">
            <span className="inline-flex items-center gap-[7px] rounded-full bg-brand-tint px-[14px] py-[7px] text-xs font-bold uppercase tracking-[0.04em] text-brand-mid">
              Há mais de 20 anos no transporte rodoviário
            </span>
            <h1 className="mt-5 font-display text-[34px] font-extrabold leading-[1.1] tracking-[-0.02em] text-ink text-balance sm:text-[40px] lg:text-[46px]">
              Sua carga no destino certo, no prazo certo
            </h1>
            <p className="mt-[18px] max-w-[46ch] text-[17px] leading-[1.55] text-muted">
              Soluções completas de transporte e logística com rastreamento em
              tempo real, do ponto de coleta à entrega final.
            </p>

            {/* Tracking box */}
            <div className="mt-7 rounded-[18px] border border-line bg-white p-[18px] shadow-[0_10px_30px_rgba(74,14,143,0.08)]">
              <div className="mb-[10px] text-[12.5px] font-bold uppercase tracking-[0.04em] text-brand-mid">
                Rastreie seu pedido
              </div>
              <TrackSearch
                variant="hero"
                placeholder="Digite o CPF ou código do pedido"
              />
            </div>
          </div>

          {/* Real photo: drop a file in /public/fleet and add src="/fleet/truck.jpg" */}
          <PhotoSlot
            scene="highway"
            label="Frota Astro Fretes em rodovia"
            caption="Frota própria · cobertura nacional"
            className="h-[300px] shadow-float sm:h-[380px] lg:h-[440px]"
          />
        </div>
      </section>

      {/* Stats band */}
      <section className="grid grid-cols-2 gap-6 border-y border-line bg-brand-wash px-6 py-9 md:grid-cols-4 lg:px-11">
        {STATS.map((s, i) => (
          <div
            key={s.label}
            className={`text-center ${i > 0 ? "md:border-l md:border-field" : ""}`}
          >
            <div className="font-display text-[34px] font-extrabold text-brand">
              {s.value}
            </div>
            <div className="mt-[3px] text-[13px] text-muted">{s.label}</div>
          </div>
        ))}
      </section>

      {/* Serviços */}
      <section id="servicos" className="bg-white px-6 py-16 lg:px-11">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-[560px] text-center">
            <div className="text-[12.5px] font-bold uppercase tracking-[0.05em] text-brand-mid">
              O que fazemos
            </div>
            <h2 className="mt-3 font-display text-[28px] font-extrabold tracking-[-0.01em] text-ink sm:text-[34px]">
              Soluções logísticas de ponta a ponta
            </h2>
            <p className="mt-[14px] text-[15.5px] leading-[1.6] text-muted">
              Estrutura, tecnologia e equipe dedicada para cuidar de cada etapa
              da sua entrega.
            </p>
          </div>
          <div className="mt-11 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {SERVICES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-[18px] border border-line p-[26px] transition-transform duration-150 hover:-translate-y-1"
              >
                <div className="flex h-[52px] w-[52px] items-center justify-center rounded-[15px] bg-brand-tint">
                  <Icon size={26} color="#7B2FBE" />
                </div>
                <h3 className="mt-[18px] font-display text-[17px] font-bold text-ink">
                  {title}
                </h3>
                <p className="mt-2 text-[13.5px] leading-[1.55] text-muted">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* A empresa */}
      <section id="empresa" className="bg-white px-6 pb-16 lg:px-11">
        <div className="mx-auto grid max-w-6xl items-center gap-10 rounded-[24px] border border-line bg-brand-wash p-7 sm:p-11 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12">
          <PhotoSlot
            scene="warehouse"
            label="Centro de distribuição Astro Fretes"
            caption="Centro de distribuição"
            radius={18}
            className="h-[260px] shadow-float sm:h-[340px]"
          />
          <div>
            <div className="text-[12.5px] font-bold uppercase tracking-[0.05em] text-brand-mid">
              A empresa
            </div>
            <h2 className="mt-3 font-display text-[26px] font-extrabold tracking-[-0.01em] text-ink sm:text-[32px]">
              Logística feita com compromisso
            </h2>
            <p className="mt-4 text-[15px] leading-[1.65] text-muted">
              A Astro Fretes nasceu para tornar o transporte de cargas mais
              transparente. Unimos frota própria, tecnologia de rastreamento e
              uma equipe dedicada para garantir que cada entrega chegue com
              segurança e dentro do prazo.
            </p>
            <div className="mt-[22px] flex flex-col gap-[13px]">
              {COMPANY_POINTS.map((point) => (
                <div
                  key={point}
                  className="flex items-center gap-[11px] text-[14.5px] font-semibold text-ink"
                >
                  <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-brand-lavender">
                    <Check size={13} color="#7B2FBE" strokeWidth={3} />
                  </span>
                  {point}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Cobertura / CTA */}
      <section
        id="cobertura"
        className="flex flex-col items-start justify-between gap-6 bg-brand-lavender px-6 py-12 sm:flex-row sm:items-center lg:px-11"
      >
        <div>
          <h2 className="font-display text-[24px] font-extrabold tracking-[-0.01em] text-brand sm:text-[30px]">
            Cobertura nacional, porta a porta
          </h2>
          <p className="mt-3 max-w-[54ch] text-[15.5px] leading-[1.55] text-[#6B5A86]">
            Atendemos as cinco regiões do Brasil com cronograma de entregas e
            acompanhamento completo da sua carga.
          </p>
        </div>
        <Link
          to="/rastrear"
          className="flex-none rounded-[13px] bg-brand-mid px-[30px] py-4 text-[15px] font-bold text-white no-underline shadow-[0_12px_30px_rgba(123,47,190,0.3)]"
        >
          Solicitar cotação
        </Link>
      </section>

      <SiteFooter />
    </main>
  );
}
