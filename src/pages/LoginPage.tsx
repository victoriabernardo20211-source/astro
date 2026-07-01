import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock } from "@/components/icons";
import { login, DEMO_CREDENTIALS } from "@/lib/auth";

export default function LoginPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(DEMO_CREDENTIALS.user);
  const [password, setPassword] = useState(DEMO_CREDENTIALS.password);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (await login(user, password)) {
        navigate("/painel");
      } else {
        setError("Usuário ou senha inválidos.");
      }
    } catch {
      setError("Não foi possível conectar ao servidor.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col justify-center bg-brand-wash px-6 py-12 text-ink">
      <div className="mx-auto w-full max-w-[400px]">
        <form
          onSubmit={submit}
          className="rounded-[22px] bg-white px-[26px] py-[34px] shadow-[0_14px_44px_rgba(74,14,143,0.10)]"
        >
          <div className="mx-auto flex h-[60px] w-[60px] items-center justify-center rounded-[18px] bg-brand-tint">
            <Lock size={28} color="#7B2FBE" />
          </div>
          <h1 className="mt-[18px] text-center font-display text-[21px] font-extrabold tracking-[-0.01em] text-brand">
            Painel do Cliente
          </h1>
          <p className="mt-[7px] text-center text-[13px] text-muted">
            Entre para gerenciar seus rastreamentos.
          </p>

          <label className="mb-[7px] mt-[26px] block text-xs font-semibold text-ink">
            Usuário
          </label>
          <input
            value={user}
            onChange={(e) => setUser(e.target.value)}
            className="nb-input w-full px-[14px] py-[13px] text-sm"
          />

          <label className="mb-[7px] mt-4 block text-xs font-semibold text-ink">
            Senha
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="nb-input w-full px-[14px] py-[13px] text-sm"
          />

          {error && (
            <p className="mt-3 text-[13px] font-medium text-[#A23B3B]">{error}</p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="mt-6 w-full rounded-[13px] bg-brand p-[15px] text-[15px] font-bold text-white shadow-[0_8px_20px_rgba(74,14,143,0.28)] disabled:opacity-60"
          >
            {busy ? "Entrando…" : "Entrar"}
          </button>

          <Link
            to="#"
            className="mt-4 block text-center text-[13px] font-semibold text-brand-mid no-underline"
          >
            Esqueceu a senha?
          </Link>
        </form>
        <div className="mt-5 text-center text-xs text-faint">
          © 2026 Astro Fretes
        </div>
      </div>
    </main>
  );
}
