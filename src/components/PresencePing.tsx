import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

function sessionId(): string {
  try {
    let s = sessionStorage.getItem("astro-fretes:sid");
    if (!s) {
      s =
        (typeof crypto !== "undefined" && crypto.randomUUID?.()) ||
        Math.random().toString(36).slice(2);
      sessionStorage.setItem("astro-fretes:sid", s);
    }
    return s;
  } catch {
    return "anon";
  }
}

/** Envia um "batimento" de presença nas páginas públicas (não no admin). */
export default function PresencePing() {
  const { pathname } = useLocation();
  const pathRef = useRef(pathname);
  pathRef.current = pathname;

  useEffect(() => {
    // não conta o próprio admin como visitante
    if (pathname.startsWith("/painel") || pathname.startsWith("/login")) return;

    const ping = () => {
      fetch("/api/presence", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: sessionId(), path: pathRef.current }),
        keepalive: true,
      }).catch(() => {});
    };
    ping();
    const t = setInterval(ping, 25_000);
    return () => clearInterval(t);
  }, [pathname]);

  return null;
}
