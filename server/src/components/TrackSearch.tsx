import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Search } from "./icons";

interface TrackSearchProps {
  /** Visual style. "hero" = home box; "page" = tracking page; "compact" = restated bar. */
  variant?: "hero" | "page" | "compact";
  placeholder?: string;
  defaultValue?: string;
  buttonLabel?: string;
}

export default function TrackSearch({
  variant = "page",
  placeholder = "Digite seu código",
  defaultValue = "",
  buttonLabel = "Rastrear",
}: TrackSearchProps) {
  const navigate = useNavigate();
  const [value, setValue] = useState(defaultValue);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const q = value.trim();
    navigate(q ? `/rastrear?codigo=${encodeURIComponent(q)}` : "/rastrear");
  }

  if (variant === "compact") {
    return (
      <form
        onSubmit={submit}
        className="flex items-center gap-[10px] rounded-xl bg-white py-[6px] pl-4 pr-[6px]"
      >
        <Search size={17} color="#9A8FB0" />
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Rastrear outro código"
          className="w-[180px] bg-transparent text-sm text-ink outline-none sm:w-[200px]"
        />
        <button
          type="submit"
          className="rounded-[9px] bg-brand-mid px-[18px] py-[10px] text-[13.5px] font-bold text-white"
        >
          {buttonLabel}
        </button>
      </form>
    );
  }

  const inputPad = variant === "hero" ? "px-4 py-[14px] text-[14.5px]" : "px-4 py-[15px] text-[15px]";
  const btnPad = variant === "hero" ? "px-[26px] text-[14.5px]" : "px-7 text-[15px]";

  return (
    <form onSubmit={submit} className="flex gap-[10px] sm:gap-3">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className={`nb-input min-w-0 flex-1 font-sans text-ink ${inputPad}`}
      />
      <button
        type="submit"
        className={`flex flex-none items-center gap-2 rounded-xl bg-brand-mid font-bold text-white ${btnPad}`}
      >
        <Search size={variant === "hero" ? 17 : 18} color="#fff" />
        <span className="hidden sm:inline">{buttonLabel}</span>
      </button>
    </form>
  );
}
