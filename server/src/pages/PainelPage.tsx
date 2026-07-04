import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Cube, Plus } from "@/components/icons";
import { isAuthenticated, logout, ADMIN_PROFILE } from "@/lib/auth";
import { LOGIN_PATH } from "@/lib/admin-path";
import { AdminDataProvider } from "@/lib/admin-store";
import TrackingsTab from "@/components/dashboard/TrackingsTab";
import UploadTab from "@/components/dashboard/UploadTab";
import PedidosLpqvTab from "@/components/dashboard/PedidosLpqvTab";
import ArquivosTab from "@/components/dashboard/ArquivosTab";
import ContaTab from "@/components/dashboard/ContaTab";
import AcessosTab from "@/components/dashboard/AcessosTab";
import AoVivoTab from "@/components/dashboard/AoVivoTab";
import WebhooksTab from "@/components/dashboard/WebhooksTab";

const TABS = [
  "Ao vivo",
  "Rastreamentos",
  "Pedidos LPQV",
  "Acessos",
  "Upload Planilha",
  "Webhooks",
  "Meus Arquivos",
  "Minha Conta",
] as const;

type Tab = (typeof TABS)[number];

export default function PainelPage() {
  const navigate = useNavigate();
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState<Tab>("Ao vivo");

  useEffect(() => {
    if (isAuthenticated()) {
      setAuthed(true);
    } else {
      navigate(LOGIN_PATH, { replace: true });
    }
  }, [navigate]);

  if (!authed) return null;

  return (
    <AdminDataProvider
      onUnauthorized={() => {
        logout();
        navigate(LOGIN_PATH, { replace: true });
      }}
    >
      <main className="min-h-screen bg-brand-wash text-ink">
      {/* Header */}
      <header className="flex flex-col gap-4 bg-brand px-6 py-[18px] sm:flex-row sm:items-center sm:justify-between lg:px-7">
        <div className="flex items-center gap-[11px]">
          <span className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-white/[0.14]">
            <Cube size={19} color="#fff" />
          </span>
          <div className="font-display text-[16px] font-bold text-white">
            Painel do Cliente{" "}
            <span className="mx-1 font-normal opacity-50">·</span>{" "}
            <span className="font-medium opacity-[0.82]">
              Bem-vindo, {ADMIN_PROFILE.displayName}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setTab("Upload Planilha")}
            className="flex items-center gap-[7px] rounded-[11px] bg-brand-mid px-[18px] py-[11px] text-[13.5px] font-bold text-white"
          >
            <Plus size={16} color="#fff" />
            Novo Rastreamento
          </button>
          <button
            onClick={() => {
              logout();
              navigate(LOGIN_PATH);
            }}
            className="rounded-[11px] border-[1.5px] border-white/40 bg-transparent px-[18px] py-[11px] text-[13.5px] font-semibold text-white"
          >
            Sair
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex gap-[30px] overflow-x-auto border-b border-line bg-white px-6 lg:px-7">
        {TABS.map((t) => {
          const activeTab = t === tab;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`whitespace-nowrap border-b-[2.5px] py-[17px] text-[14px] ${
                activeTab
                  ? "border-brand-mid font-bold text-brand"
                  : "border-transparent font-medium text-muted"
              }`}
              style={{ marginBottom: -1 }}
            >
              {t}
            </button>
          );
        })}
      </div>

      {/* Body */}
      <div className="px-6 pb-12 pt-[26px] lg:px-7">
        {tab === "Ao vivo" && <AoVivoTab />}
        {tab === "Rastreamentos" && <TrackingsTab />}
        {tab === "Upload Planilha" && <UploadTab />}
        {tab === "Pedidos LPQV" && <PedidosLpqvTab />}
        {tab === "Acessos" && <AcessosTab />}
        {tab === "Webhooks" && <WebhooksTab />}
        {tab === "Meus Arquivos" && <ArquivosTab />}
        {tab === "Minha Conta" && <ContaTab />}
      </div>
      </main>
    </AdminDataProvider>
  );
}
