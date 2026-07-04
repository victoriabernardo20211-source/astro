/**
 * Caminho secreto do admin — não é "/login"/"/painel" (previsível) por padrão.
 * Defina VITE_ADMIN_PATH no .env com um valor só seu para trocar o padrão.
 */
const slug = (import.meta.env.VITE_ADMIN_PATH || "gestao-lpqv-8f2k")
  .trim()
  .replace(/^\/+|\/+$/g, "");

export const LOGIN_PATH = `/${slug}`;
export const PAINEL_PATH = `/${slug}/painel`;
