import { useAdmin } from "@/lib/admin-store";
import { ordersToCsv } from "@/lib/csv";
import { FileText, Download, Calendar } from "@/components/icons";

export default function ArquivosTab() {
  const { imports, orders, loading } = useAdmin();

  function exportBase() {
    const blob = new Blob([ordersToCsv(orders)], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "astro-fretes-pedidos.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-display text-[18px] font-bold text-ink">
            Meus Arquivos
          </h3>
          <p className="mt-1 text-[13px] text-muted">
            Histórico de planilhas importadas e exportação da base atual.
          </p>
        </div>
        <button
          onClick={exportBase}
          disabled={orders.length === 0}
          className="flex items-center gap-2 self-start rounded-[11px] bg-brand-mid px-[18px] py-[11px] text-[13.5px] font-bold text-white disabled:opacity-50"
        >
          <Download size={16} color="#fff" />
          Exportar base ({orders.length})
        </button>
      </div>

      {imports.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-field bg-white py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-tint">
            <FileText size={26} color="#7B2FBE" />
          </span>
          <h4 className="mt-4 font-display text-[16px] font-bold text-ink">
            {loading ? "Carregando…" : "Nenhum arquivo importado ainda"}
          </h4>
          <p className="mt-1 max-w-[42ch] text-[13px] text-muted">
            As planilhas que você importar na aba “Upload Planilha” aparecerão
            aqui, com data e quantidade de pedidos.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {imports.map((f) => (
            <div
              key={f.id}
              className="flex items-center gap-4 rounded-2xl border border-line bg-white p-4"
            >
              <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-brand-tint">
                <FileText size={22} color="#7B2FBE" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold text-ink">{f.name}</div>
                <div className="mt-[3px] flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-muted">
                  <span className="flex items-center gap-1">
                    <Calendar size={13} color="#9A8FB0" />{" "}
                    {f.createdAt
                      ? new Date(f.createdAt).toLocaleString("pt-BR")
                      : "—"}
                  </span>
                  <span>
                    {f.count} pedido(s){f.added ? ` · ${f.added} novo(s)` : ""}
                  </span>
                  <span
                    className="rounded-full px-2 py-[2px] text-[11px] font-bold"
                    style={
                      f.mode === "replace"
                        ? { background: "#FBE7D6", color: "#C2410C" }
                        : { background: "#E8D5FF", color: "#7B2FBE" }
                    }
                  >
                    {f.mode === "replace" ? "Substituição" : "Adição"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
