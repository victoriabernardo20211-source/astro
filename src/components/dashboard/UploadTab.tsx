import { useRef, useState } from "react";
import { useAdmin } from "@/lib/admin-store";
import { CSV_TEMPLATE } from "@/lib/csv";
import { Upload, FileText, Check, Info } from "@/components/icons";

export default function UploadTab() {
  const { importCsv } = useAdmin();
  const inputRef = useRef<HTMLInputElement>(null);

  const [fileName, setFileName] = useState("");
  const [csv, setCsv] = useState("");
  const [rowEstimate, setRowEstimate] = useState(0);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);

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
      const result = await importCsv(csv, mode, fileName || "planilha.csv");
      setMessage(
        mode === "merge"
          ? `${result.count} pedido(s) processado(s) — ${result.added} novo(s) adicionado(s).`
          : `Base substituída por ${result.count} pedido(s).`
      );
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

    </div>
  );
}
