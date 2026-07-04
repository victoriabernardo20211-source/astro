import { useRef, useState } from "react";
import { useAdmin } from "@/lib/admin-store";
import { sendTestEmail } from "@/lib/api";
import { CSV_TEMPLATE } from "@/lib/csv";
import { Upload, FileText, Check, Info, Mail } from "@/components/icons";

export default function UploadTab() {
  const { importCsv } = useAdmin();
  const inputRef = useRef<HTMLInputElement>(null);

  const [testTo, setTestTo] = useState("");
  const [testMsg, setTestMsg] = useState("");
  const [testErr, setTestErr] = useState("");
  const [testBusy, setTestBusy] = useState(false);

  async function enviarTeste() {
    if (!testTo.trim()) return;
    setTestBusy(true);
    setTestMsg("");
    setTestErr("");
    try {
      await sendTestEmail(testTo.trim());
      setTestMsg(`E-mail de teste enviado para ${testTo.trim()}. Confira a caixa de entrada (e o spam).`);
    } catch (e) {
      setTestErr(e instanceof Error ? e.message : "Falha ao enviar.");
    } finally {
      setTestBusy(false);
    }
  }

  const [fileName, setFileName] = useState("");
  const [csv, setCsv] = useState("");
  const [rowEstimate, setRowEstimate] = useState(0);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [autoEmail, setAutoEmail] = useState(
    () => localStorage.getItem("astro-fretes:autoEmail") !== "0"
  );

  function toggleAutoEmail(v: boolean) {
    setAutoEmail(v);
    try {
      localStorage.setItem("astro-fretes:autoEmail", v ? "1" : "0");
    } catch {
      /* ignore */
    }
  }

  async function handleFile(file: File) {
    setMessage("");
    setErrors([]);
    setFileName(file.name);
    const text = await file.text();
    setCsv(text);
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    setRowEstimate(Math.max(0, lines.length - 1));
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function clear() {
    setFileName("");
    setCsv("");
    setRowEstimate(0);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function doImport(mode: "merge" | "replace") {
    if (!csv) return;
    setBusy(true);
    setMessage("");
    setErrors([]);
    try {
      const result = await importCsv(csv, mode, fileName || "planilha.csv", autoEmail);
      const base =
        mode === "merge"
          ? `${result.count} pedido(s) processado(s) — ${result.added} novo(s) adicionado(s).`
          : `Base substituída por ${result.count} pedido(s).`;
      const mail = !autoEmail
        ? " Envio automático desligado — os e-mails podem ser enviados manualmente na aba Rastreamentos."
        : result.mailConfigured
          ? ` ${result.emailed ?? 0} e-mail(s) de postagem enviado(s)${
              result.emailSkipped ? ` (${result.emailSkipped} acima do limite)` : ""
            }.`
          : " (SMTP não configurado — nenhum e-mail enviado.)";
      setMessage(base + mail);
      if (result.errors?.length) setErrors(result.errors);
      clear();
    } catch (e) {
      setErrors([e instanceof Error ? e.message : "Falha ao importar."]);
    } finally {
      setBusy(false);
    }
  }

  function downloadTemplate() {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "modelo-astro-fretes.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="max-w-3xl">
      <h3 className="font-display text-[18px] font-bold text-ink">
        Upload de Planilha
      </h3>
      <p className="mt-1 text-[13px] text-muted">
        Importe o CSV exportado da LPQV. As colunas são reconhecidas
        automaticamente (Cliente, Documento/CPF, Status envio, Cidade, UF,
        Produto, foto, código do pedido…). Os pedidos vão para o banco e ficam
        disponíveis no rastreio público.
      </p>

      {/* Dropzone */}
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`mt-5 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
          dragOver ? "border-brand-mid bg-brand-tint" : "border-field bg-white"
        }`}
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-tint">
          <Upload size={26} color="#7B2FBE" />
        </span>
        <span className="mt-4 text-[15px] font-bold text-ink">
          Arraste o arquivo CSV aqui
        </span>
        <span className="mt-1 text-[13px] text-muted">
          ou clique para selecionar do computador
        </span>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={onInputChange}
          className="hidden"
        />
      </label>

      <button
        onClick={downloadTemplate}
        className="mt-3 flex items-center gap-2 text-[13px] font-semibold text-brand-mid"
      >
        <FileText size={15} color="#7B2FBE" /> Baixar planilha modelo
      </button>

      {/* Selected file + actions */}
      {csv && (
        <div className="mt-5 rounded-2xl border border-line bg-white p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-brand-tint">
              <FileText size={22} color="#7B2FBE" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold text-ink">{fileName}</div>
              <div className="text-[12.5px] text-muted">
                ~{rowEstimate} linha(s) de pedido detectada(s)
              </div>
            </div>
            <button
              onClick={clear}
              disabled={busy}
              className="text-[13px] font-semibold text-faint"
            >
              Limpar
            </button>
          </div>

          <label className="mt-4 flex cursor-pointer items-center gap-2 text-[13.5px] font-medium text-ink">
            <input
              type="checkbox"
              checked={autoEmail}
              onChange={(e) => toggleAutoEmail(e.target.checked)}
              className="h-4 w-4 accent-[#7B2FBE]"
            />
            Enviar e-mail de postagem automaticamente aos pedidos novos
            <span className="text-faint">
              (desmarque para enviar manualmente depois)
            </span>
          </label>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={() => doImport("merge")}
              disabled={busy}
              className="rounded-xl bg-brand-mid px-5 py-3 text-[14px] font-bold text-white disabled:opacity-60"
            >
              {busy ? "Importando…" : "Importar (adicionar)"}
            </button>
            <button
              onClick={() => doImport("replace")}
              disabled={busy}
              className="rounded-xl border-[1.5px] border-brand-mid bg-transparent px-5 py-3 text-[14px] font-bold text-brand disabled:opacity-60"
            >
              Substituir tudo
            </button>
          </div>
        </div>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <div className="mt-5 rounded-xl border border-[#F3C9C9] bg-[#FDF1F1] px-4 py-3">
          {errors.map((err, i) => (
            <div
              key={i}
              className="flex items-start gap-2 text-[13px] leading-[1.5] text-[#A23B3B]"
            >
              <Info size={15} color="#C2410C" className="mt-[2px] flex-none" />
              {err}
            </div>
          ))}
        </div>
      )}

      {/* Success */}
      {message && (
        <div className="mt-5 flex items-center gap-2 rounded-xl border border-[#BCE6CC] bg-[#EAF8F0] px-4 py-3 text-[13.5px] font-medium text-[#1F8A5B]">
          <Check size={16} color="#1F8A5B" strokeWidth={3} />
          {message}
        </div>
      )}

      {/* Enviar e-mail de teste */}
      <div className="mt-8 rounded-2xl border border-line bg-white p-5">
        <div className="flex items-center gap-2">
          <Mail size={18} color="#7B2FBE" />
          <h4 className="font-display text-[15px] font-bold text-ink">
            Testar e-mail de postagem
          </h4>
        </div>
        <p className="mt-1 text-[13px] text-muted">
          Envie um e-mail de exemplo (igual ao que o cliente recebe) para conferir
          se o SMTP está funcionando.
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            type="email"
            value={testTo}
            onChange={(e) => setTestTo(e.target.value)}
            placeholder="seu-email@exemplo.com"
            className="flex-1 rounded-[11px] border-[1.5px] border-field bg-white px-[14px] py-[10px] text-[14px] text-ink outline-none"
          />
          <button
            onClick={enviarTeste}
            disabled={testBusy || !testTo.trim()}
            className="rounded-[11px] bg-brand-mid px-5 py-[10px] text-[14px] font-bold text-white disabled:opacity-50"
          >
            {testBusy ? "Enviando…" : "Enviar teste"}
          </button>
        </div>
        {testMsg && (
          <div className="mt-3 flex items-center gap-2 text-[13px] font-medium text-[#1F8A5B]">
            <Check size={15} color="#1F8A5B" strokeWidth={3} /> {testMsg}
          </div>
        )}
        {testErr && (
          <div className="mt-3 flex items-start gap-2 text-[13px] text-[#A23B3B]">
            <Info size={15} color="#C2410C" className="mt-[2px] flex-none" /> {testErr}
          </div>
        )}
      </div>
    </div>
  );
}
