import { useState } from "react";

export default function StaffLogin({
  onLogin,
  title = "Acceso de empleados",
}: {
  onLogin: (email: string, password: string) => Promise<void>;
  title?: string;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  return (
    <form
      className="glass mx-auto max-w-sm space-y-4 rounded-2xl p-6"
      onSubmit={async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError("");
        try {
          await onLogin(email.trim(), password);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Correo o contraseña incorrectos.");
        } finally {
          setSubmitting(false);
        }
      }}
    >
      <div className="text-center">
        <span className="text-3xl">🔐</span>
        <h2 className="mt-2 text-lg font-bold">{title}</h2>
        <p className="mt-1 text-xs text-carrot-50/60">
          Demo: admin@donzanahorio.com o cajero@donzanahorio.com — contraseña DonZanahorio2026!
        </p>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-semibold">Correo</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full rounded-xl bg-carrot-50/10 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-carrot-400"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-semibold">Contraseña</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full rounded-xl bg-carrot-50/10 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-carrot-400"
        />
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-full bg-carrot-500 py-2.5 text-sm font-semibold text-ink-950 hover:bg-carrot-400 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {submitting ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
