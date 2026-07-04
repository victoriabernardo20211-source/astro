import { Link } from "react-router-dom";
import { Cube } from "./icons";

const COLS = [
  {
    title: "Navegação",
    links: ["Início", "A empresa", "Serviços", "Frota"],
  },
  {
    title: "Serviços",
    links: ["Carga fracionada", "Carga dedicada", "Armazenagem", "Coletas & devoluções"],
  },
];

export default function SiteFooter() {
  return (
    <footer
      id="atendimento"
      className="bg-brand px-6 pb-[30px] pt-12 text-white lg:px-11"
    >
      <div className="grid gap-9 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-[10px]">
            <span className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-white/[0.14]">
              <Cube size={18} color="#fff" />
            </span>
            <span className="font-display text-[17px] font-bold">
              Astro<span className="font-medium opacity-[0.72]"> Fretes</span>
            </span>
          </div>
          <p className="mt-4 max-w-[34ch] text-[13.5px] leading-[1.6] text-[#BBA8D8]">
            Transporte rodoviário de cargas com rastreamento em tempo real e
            cobertura nacional.
          </p>
        </div>

        {COLS.map((col) => (
          <div key={col.title}>
            <div className="mb-[14px] text-[13px] font-bold text-white">
              {col.title}
            </div>
            <div className="flex flex-col gap-[10px] text-[13.5px] text-[#BBA8D8]">
              {col.links.map((l) => (
                <a key={l} href="#" className="text-[#BBA8D8] no-underline">
                  {l}
                </a>
              ))}
            </div>
          </div>
        ))}

        <div>
          <div className="mb-[14px] text-[13px] font-bold text-white">Contato</div>
          <div className="flex flex-col gap-[10px] text-[13.5px] text-[#BBA8D8]">
            <span>0800 701 2200</span>
            <span>contato@astrofretes.com.br</span>
            <span>Atendimento: Seg a Sex, 8h–18h</span>
          </div>
        </div>
      </div>

      <div className="mt-[34px] flex flex-col items-start justify-between gap-3 border-t border-white/10 pt-5 text-[12.5px] text-[#9A86BC] sm:flex-row sm:items-center">
        <span>© 2026 Astro Fretes. Todos os direitos reservados.</span>
        <span className="flex gap-5">
          <Link to="#" className="text-[#9A86BC] no-underline">
            Política de privacidade
          </Link>
          <Link to="#" className="text-[#9A86BC] no-underline">
            Termos de uso
          </Link>
        </span>
      </div>
    </footer>
  );
}
