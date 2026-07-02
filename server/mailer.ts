import nodemailer from "nodemailer";
import type { NewOrderRow } from "./schema.js";

const HOST = process.env.SMTP_HOST || "";
const PORT = Number(process.env.SMTP_PORT || 465);
const USER = process.env.SMTP_USER || "";
const PASS = process.env.SMTP_PASS || "";
const FROM = process.env.MAIL_FROM || USER;
const FROM_NAME = process.env.MAIL_FROM_NAME || "Rastreamento";
const SITE_URL = (process.env.SITE_URL || "").replace(/\/+$/, "");

/** Só envia se as credenciais SMTP estiverem configuradas. */
export function isMailConfigured(): boolean {
  return Boolean(HOST && USER && PASS);
}

let transporter: nodemailer.Transporter | null = null;
function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: HOST,
      port: PORT,
      secure: PORT === 465, // 465 = SSL; 587 = STARTTLS
      auth: { user: USER, pass: PASS },
    });
  }
  return transporter;
}

const isEmail = (e?: string | null): e is string =>
  !!e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

function trackUrl(codigo: string): string {
  return SITE_URL ? `${SITE_URL}/rastrear?codigo=${encodeURIComponent(codigo)}` : "";
}

function buildHtml(order: NewOrderRow): string {
  const nome = (order.cliente || "").split(" ")[0] || "Olá";
  const url = trackUrl(order.codigo);
  const botao = url
    ? `<a href="${url}" style="display:inline-block;background:#4A0E8F;color:#fff;text-decoration:none;font-weight:700;padding:13px 22px;border-radius:12px;font-size:15px">Acompanhar meu pedido</a>`
    : "";
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;color:#1c1830">
    <div style="background:#4A0E8F;padding:22px 24px;border-radius:14px 14px 0 0">
      <span style="color:#fff;font-size:18px;font-weight:800">📦 Seu pedido foi postado</span>
    </div>
    <div style="border:1px solid #eee;border-top:0;border-radius:0 0 14px 14px;padding:24px">
      <p style="font-size:15px">Olá, ${nome}! Seu pedido foi postado e já está a caminho.</p>
      <p style="font-size:13px;color:#666;margin-bottom:6px">Seu código de rastreio:</p>
      <div style="font-size:22px;font-weight:800;letter-spacing:1px;color:#4A0E8F;margin-bottom:18px">${order.codigo}</div>
      ${botao}
      <p style="font-size:12.5px;color:#888;margin-top:20px">Acompanhe o status da entrega pelo nosso site a qualquer momento.</p>
    </div>
  </div>`;
}

/** Envia um e-mail de TESTE (mesmo modelo do "pedido postado") para um endereço. */
export async function sendTestEmail(to: string): Promise<void> {
  if (!isMailConfigured()) throw new Error("SMTP não configurado.");
  if (!isEmail(to)) throw new Error("E-mail inválido.");
  const demo: NewOrderRow = {
    codigo: "AF0000000000BR",
    cliente: "Cliente Teste",
    email: to,
    status: "Em separação",
  } as NewOrderRow;
  await getTransporter().sendMail({
    from: `"${FROM_NAME}" <${FROM}>`,
    to,
    subject: `[TESTE] Seu pedido foi postado — código ${demo.codigo}`,
    text: `E-mail de teste.\nCódigo de rastreio: ${demo.codigo}\n${trackUrl(demo.codigo) ? "Acompanhe: " + trackUrl(demo.codigo) : ""}`,
    html: buildHtml(demo),
  });
}

/** Envia o e-mail de "pedido postado" com o código e o link de acompanhamento. */
export async function sendPostadoEmail(order: NewOrderRow): Promise<boolean> {
  if (!isMailConfigured() || !isEmail(order.email)) return false;
  const url = trackUrl(order.codigo);
  await getTransporter().sendMail({
    from: `"${FROM_NAME}" <${FROM}>`,
    to: order.email!,
    subject: `Seu pedido foi postado — código ${order.codigo}`,
    text: `Olá! Seu pedido foi postado.\nCódigo de rastreio: ${order.codigo}\n${url ? "Acompanhe: " + url : ""}`,
    html: buildHtml(order),
  });
  return true;
}

const MAX_PER_IMPORT = 300;
const CONCURRENCY = 6;

export interface MailBatchResult {
  sent: number;
  skipped: number; // acima do limite por importação
  failed: number;
}

/** Dispara o e-mail de postagem para os pedidos novos (com limite e concorrência). */
export async function sendPostadoBatch(orders: NewOrderRow[]): Promise<MailBatchResult> {
  if (!isMailConfigured()) return { sent: 0, skipped: 0, failed: 0 };
  const withEmail = orders.filter((o) => isEmail(o.email));
  const list = withEmail.slice(0, MAX_PER_IMPORT);
  let sent = 0;
  let failed = 0;
  for (let i = 0; i < list.length; i += CONCURRENCY) {
    const chunk = list.slice(i, i + CONCURRENCY);
    const res = await Promise.allSettled(chunk.map((o) => sendPostadoEmail(o)));
    for (const r of res) {
      if (r.status === "fulfilled" && r.value) sent++;
      else if (r.status === "rejected") failed++;
    }
  }
  return { sent, skipped: withEmail.length - list.length, failed };
}
