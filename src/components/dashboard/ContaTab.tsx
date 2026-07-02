import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { logout, DEMO_CREDENTIALS } from "@/lib/auth";
import { User, Mail, Phone, Bell, Lock } from "@/components/icons";

const PREFS_KEY = "astro-fretes:prefs";

interface Prefs {
  emailUpdates: boolean;
  smsUpdates: boolean;
}

function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) return { emailUpdates: true, smsUpdates: false, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return { emailUpdates: true, smsUpdates: false };
}

function Field({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof User;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-brand-wash px-4 py-3">
      <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-white">
        <Icon size={17} color="#7B2FBE" />
      </span>
      <div>
        <div className="text-[11.5px] font-semibold uppercase tracking-[0.04em] text-faint">
          {label}
        </div>
        <div className="text-[14px] font-semibold text-ink">{value}</div>
      </div>
    </div>
  );
}

function Toggle({
  label,
  desc,
  on,
  onToggle,
}: {
  label: string;
  desc: string;
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="flex items-start gap-3">
        <Bell size={18} color="#7B2FBE" className="mt-[2px] flex-none" />
        <div>
          <div className="text-[14px] font-semibold text-ink">{label}</div>
          <div className="text-[12.5px] text-muted">{desc}</div>
        </div>
      </div>
      <button
        role="switch"
        aria-checked={on}
        aria-label={label}
        onClick={onToggle}
        className={`relative h-[26px] w-[46px] flex-none rounded-full transition-colors ${
          on ? "bg-brand-mid" : "bg-[#D8CEE8]"
        }`}
      >
        <span
          className={`absolute top-[3px] h-5 w-5 rounded-full bg-white shadow transition-all ${
            on ? "left-[23px]" : "left-[3px]"
          }`}
        />
      </button>
    </div>
  );
}

export default function ContaTab() {
  const navigate = useNavigate();
  const [prefs, setPrefs] = useState<Prefs>({ emailUpdates: true, smsUpdates: false });

  useEffect(() => setPrefs(loadPrefs()), []);

  function update(patch: Partial<Prefs>) {
    setPrefs((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(PREFS_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  return (
    <div className="max-w-3xl">
      <h3 className="font-display text-[18px] font-bold text-ink">Minha Conta</h3>
      <p className="mt-1 text-[13px] text-muted">
        Dados da conta, preferências de notificação e acesso.
      </p>

      {/* Profile header */}
      <div className="mt-5 flex items-center gap-4 rounded-2xl border border-line bg-white p-5">
        <span className="flex h-16 w-16 flex-none items-center justify-center rounded-2xl bg-brand font-display text-[22px] font-extrabold text-white">
          {DEMO_CREDENTIALS.displayName.slice(0, 2)}
        </span>
        <div>
          <div className="font-display text-[18px] font-bold text-ink">
            {DEMO_CREDENTIALS.displayName}
          </div>
          <div className="text-[13px] text-muted">Conta LPQV · Cliente corporativo</div>
          <span className="mt-2 inline-block rounded-full bg-[#D8F5E3] px-[10px] py-[3px] text-[11.5px] font-bold text-[#1F8A5B]">
            Ativa
          </span>
        </div>
      </div>

      {/* Account fields */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Field icon={User} label="Usuário" value={DEMO_CREDENTIALS.user} />
        <Field icon={Mail} label="E-mail" value="contato@lpqv.com.br" />
        <Field icon={Phone} label="Telefone" value="(11) 4002-8922" />
        <Field icon={Lock} label="Plano" value="Logística Empresarial" />
      </div>

      {/* Preferences */}
      <div className="mt-6 rounded-2xl border border-line bg-white px-5 py-2">
        <Toggle
          label="Atualizações por e-mail"
          desc="Receba avisos de mudança de status dos pedidos."
          on={prefs.emailUpdates}
          onToggle={() => update({ emailUpdates: !prefs.emailUpdates })}
        />
        <div className="border-t border-[#F1ECF8]" />
        <Toggle
          label="Atualizações por SMS"
          desc="Avisos no celular quando a entrega sair para o destino."
          on={prefs.smsUpdates}
          onToggle={() => update({ smsUpdates: !prefs.smsUpdates })}
        />
      </div>

      {/* Actions */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          onClick={() => {
            logout();
            navigate("/login");
          }}
          className="rounded-xl bg-brand px-[18px] py-[11px] text-[13.5px] font-bold text-white"
        >
          Encerrar sessão
        </button>
      </div>
    </div>
  );
}
