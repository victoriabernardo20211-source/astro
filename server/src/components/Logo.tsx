import { Link } from "react-router-dom";
import { Cube } from "./icons";

interface LogoProps {
  /** "light" = white text on dark bg; "brand" = colored text on light bg. */
  tone?: "light" | "brand";
  size?: "sm" | "md";
}

export default function Logo({ tone = "light", size = "md" }: LogoProps) {
  const box = size === "sm" ? 30 : 38;
  const icon = size === "sm" ? 17 : 21;
  const text = size === "sm" ? "text-base" : "text-[19px]";

  return (
    <Link to="/" className="flex items-center gap-[11px] no-underline">
      <span
        className="flex items-center justify-center rounded-[11px]"
        style={{
          width: box,
          height: box,
          background: tone === "light" ? "rgba(255,255,255,0.14)" : "#4A0E8F",
        }}
      >
        <Cube size={icon} color="#fff" />
      </span>
      <span
        className={`font-display font-bold tracking-[-0.01em] ${text}`}
        style={{ color: tone === "light" ? "#fff" : "#4A0E8F" }}
      >
        Astro
        <span
          className="font-medium"
          style={{ color: tone === "light" ? "rgba(255,255,255,0.72)" : "#7B2FBE" }}
        >
          {" "}
          Fretes
        </span>
      </span>
    </Link>
  );
}
