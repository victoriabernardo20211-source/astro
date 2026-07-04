import { sendPostadoEmail, isMailConfigured } from "./server/mailer.js";
console.log("configured:", isMailConfigured());
try {
  const r = await sendPostadoEmail({ codigo: "AF123BR", cliente: "Ana Souza", email: "ana@cliente.com", status: "Em separação" } as any);
  console.log("resultado:", r);
} catch (e: any) { console.log("ERRO:", e?.message || e); }
