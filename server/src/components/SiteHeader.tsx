import { Link } from "react-router-dom";
import Logo from "./Logo";
import { Phone, Mail, User, Search } from "./icons";

const NAV = [
  { label: "Início", href: "/" },
  { label: "A empresa", href: "/#empresa" },
  { label: "Serviços", href: "/#servicos" },
  { label: "Frota", href: "/#empresa" },
  { label: "Cobertura", href: "/#cobertura" },
];

/** Dark brand header with utility bar — used on the institutional home. */
export function BrandHeader() {
  return (
    <header>
      {/* Utility bar */}
      <div className="hidden items-center justify-between border-b border-line bg-[#FBFAFE] px-6 py-[11px] text-[12.5px] text-muted md:flex lg:px-11">
        <div className="flex items-center gap-[22px]">
          <span className="flex items-center gap-[7px] opacity-90">
            <Phone size={14} color="#7B2FBE" /> 0800 701 2200
          </span>
          <span className="flex items-center gap-[7px] opacity-90">
            <Mail size={14} color="#7B2FBE" /> contato@astrofretes.com.br
          </span>
        </div>
        <span className="flex items-center gap-[6px] font-semibold text-muted">
          <User size={14} color="#7B2FBE" /> Atendimento: seg a sex, 8h às 18h
        </span>
      </div>

      {/* Main header */}
      <div className="flex items-center justify-between bg-brand px-6 py-[18px] lg:px-11">
        <Logo tone="light" />
        <nav className="hidden items-center gap-[30px] text-sm font-semibold lg:flex">
          {NAV.map((item, i) => (
            <Link
              key={item.label}
              to={item.href}
              className={`text-white no-underline ${i === 0 ? "" : "opacity-[0.82]"}`}
            >
              {item.label}
            </Link>
          ))}
          <Link
            to="/rastrear"
            className="flex items-center gap-[7px] rounded-[11px] bg-brand-mid px-5 py-[10px] text-white no-underline"
          >
            <Search size={16} color="#fff" /> Rastrear
          </Link>
        </nav>
        {/* Compact action on small screens */}
        <Link
          to="/rastrear"
          className="flex items-center gap-[7px] rounded-[11px] bg-brand-mid px-4 py-[9px] text-sm font-semibold text-white no-underline lg:hidden"
        >
          <Search size={16} color="#fff" /> Rastrear
        </Link>
      </div>
    </header>
  );
}

/** White header used on the tracking + result pages. */
export function LightHeader() {
  return (
    <header className="flex items-center justify-between border-b border-line bg-white px-6 py-5 lg:px-12">
      <Logo tone="brand" />
      <nav className="hidden items-center gap-8 text-sm font-semibold text-ink md:flex">
        <Link to="/#servicos" className="text-ink no-underline">
          Serviços
        </Link>
        <Link to="/#cobertura" className="text-ink no-underline">
          Cobertura
        </Link>
        <Link to="/#atendimento" className="text-ink no-underline">
          Atendimento
        </Link>
      </nav>
    </header>
  );
}
