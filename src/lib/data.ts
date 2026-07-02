import type { Order, TimelineStep, StepState } from "./types";

/** The 8 canonical stages every shipment moves through, in order. */
export const CANONICAL_STEPS = [
  "Pedido recebido",
  "Em separação",
  "Coletado",
  "Em trânsito",
  "Chegou no estado destino",
  "Em rota",
  "Saiu para entrega",
  "Entregue",
] as const;

/** Prazo de entrega estimado (dias) usado para a progressão automática. */
export const PRAZO_ENTREGA_DIAS = 20;

const MESES = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
];

/** Maps a free-form status to its index in CANONICAL_STEPS. */
export function statusIndex(status: string): number {
  const s = (status || "").trim().toLowerCase();
  const exact = CANONICAL_STEPS.findIndex((x) => x.toLowerCase() === s);
  if (exact !== -1) return exact;
  if (s.includes("entregue")) return 7;
  if (s.includes("saiu")) return 6;
  if (s.includes("rota")) return 5;
  if (s.includes("chegou") || s.includes("destino")) return 4;
  if (s.includes("trânsito") || s.includes("transito")) return 3;
  if (s.includes("coletad")) return 2;
  if (s.includes("separa")) return 1;
  if (s.includes("recebid")) return 0;
  return 0;
}

function parseOrderDate(order: Order): Date | null {
  // usa a data real do pedido; se faltar (imports antigos), a data em que
  // entrou no sistema (createdAt), pra nunca inventar data.
  const raw = order.dataPedido || order.createdAt;
  if (!raw) return null;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
}

/** Day offset (from the order date) at which each stage becomes current. */
function schedule(windowDays: number): number[] {
  const w = Math.max(4, windowDays);
  const t = [
    0,
    1,
    2,
    3,
    Math.round(w * 0.75),
    Math.round(w * 0.9),
    Math.round(w * 0.95),
    w,
  ];
  for (let i = 1; i < t.length; i++) if (t[i] <= t[i - 1]) t[i] = t[i - 1] + 1;
  return t;
}

function addDays(base: Date, days: number): Date {
  const d = new Date(base.getTime());
  d.setDate(d.getDate() + days);
  return d;
}

function fmt(d: Date): string {
  return `${String(d.getDate()).padStart(2, "0")} ${MESES[d.getMonth()]} ${d.getFullYear()}`;
}

export interface Progress {
  index: number;
  delivered: boolean;
}

/**
 * Etapa atual estimada. Avança pelas etapas conforme os dias desde o pedido,
 * dentro do prazo. Nunca marca "Entregue" automaticamente — só o status real
 * (importado) confirma a entrega.
 */
export function estimatedStage(
  order: Order,
  now: Date = new Date(),
  windowDays: number = PRAZO_ENTREGA_DIAS
): Progress {
  const real = statusIndex(order.status || "");
  if (real === 7) return { index: 7, delivered: true };

  const od = parseOrderDate(order);
  if (!od) return { index: real, delivered: false }; // sem data: usa status real

  const elapsed = (now.getTime() - od.getTime()) / 86_400_000;
  const th = schedule(windowDays);
  let idx = 0;
  for (let i = 0; i < 7; i++) if (elapsed >= th[i]) idx = i;
  idx = Math.min(idx, 6); // nunca "Entregue" automático
  return { index: Math.max(idx, real), delivered: false };
}

/** Rótulo do status atual exibido ao cliente (estimado). */
export function currentStatusLabel(order: Order): string {
  return CANONICAL_STEPS[estimatedStage(order).index];
}

/** Data de entrega estimada (pedido + prazo), formatada — ou null. */
export function estimatedDelivery(
  order: Order,
  windowDays: number = PRAZO_ENTREGA_DIAS
): string | null {
  if (statusIndex(order.status || "") === 7) return "Entregue";
  const od = parseOrderDate(order);
  return od ? fmt(addDays(od, windowDays)) : order.previsao ?? null;
}

/** Default location for a step, derived from the order's origin/destination. */
function defaultLocation(stepIdx: number, order: Order): string {
  const origem = order.origem || "Centro de origem";
  const destino =
    `${order.cidade ?? ""}${order.uf ? " / " + order.uf : ""}`.trim() || "destino";
  switch (stepIdx) {
    case 0:
    case 1:
      return `${origem} · Centro de origem`;
    case 2:
      return origem;
    case 3:
      return `A caminho de ${order.cidade ?? "destino"}`;
    case 4:
      return `${destino} · Centro de distribuição`;
    case 5:
      return `${destino} · veículo a caminho`;
    default:
      return destino;
  }
}

/** Builds the 8-step timeline with estimated dates from the order date. */
export function buildTimeline(order: Order): TimelineStep[] {
  const { index: current } = estimatedStage(order);
  const od = parseOrderDate(order);
  const th = schedule(PRAZO_ENTREGA_DIAS);
  return CANONICAL_STEPS.map((label, i) => {
    const state: StepState =
      i < current ? "done" : i === current ? "current" : "future";
    let time: string | undefined;
    if (state !== "future") {
      time = od ? fmt(addDays(od, Math.min(th[i], th[current]))) : i === current ? "Agora" : undefined;
    }
    return {
      key: `${order.codigo}-${i}`,
      label,
      location: state === "future" ? undefined : defaultLocation(i, order),
      time,
      state,
    };
  });
}

/** Status → badge colors used in the dashboard table. */
export function statusBadge(status: string): { bg: string; fg: string } {
  if (statusIndex(status) === 7) {
    return { bg: "#D8F5E3", fg: "#1F8A5B" }; // Entregue → green
  }
  return { bg: "#E8D5FF", fg: "#7B2FBE" }; // everything else → lavender
}
