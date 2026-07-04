import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { LightHeader } from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import TrackingSearchPanel from "@/components/TrackingSearchPanel";
import TrackingResult from "@/components/TrackingResult";
import type { Order } from "@/lib/types";
import { trackOrder } from "@/lib/api";

export default function RastrearPage() {
  const [params] = useSearchParams();
  const codigo = (params.get("codigo") ?? "").trim();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!codigo) {
      setOrder(null);
      return;
    }
    let active = true;
    setLoading(true);
    trackOrder(codigo)
      .then((o) => active && setOrder(o))
      .catch(() => active && setOrder(null))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [codigo]);

  const showResult = !loading && codigo && order;

  return (
    <main className="min-h-screen bg-brand-wash text-ink">
      <LightHeader />

      {!showResult && (
        <section className="relative overflow-hidden bg-brand px-6 pb-[46px] pt-10 lg:px-12">
          <span className="absolute -right-16 -top-16 h-[280px] w-[280px] rounded-full bg-white/5" />
          <div className="relative">
            <div className="text-[13px] font-medium text-[#C9B8E8]">
              Início <span className="mx-1 opacity-60">/</span> Rastreio
            </div>
            <h1 className="mt-3 font-display text-[28px] font-extrabold tracking-[-0.01em] text-white sm:text-[36px]">
              Rastreie sua Encomenda
            </h1>
            <p className="mt-[10px] text-[15.5px] text-[#D8C9F0]">
              Acompanhe o status da sua entrega em tempo real.
            </p>
          </div>
        </section>
      )}

      {loading ? (
        <div className="px-6 py-24 text-center text-[14px] text-muted lg:px-12">
          Consultando seu pedido…
        </div>
      ) : showResult ? (
        <TrackingResult order={order} />
      ) : (
        <TrackingSearchPanel notFound={codigo ? codigo : undefined} />
      )}

      <SiteFooter />
    </main>
  );
}
