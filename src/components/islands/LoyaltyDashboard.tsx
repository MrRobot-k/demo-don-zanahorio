import { useState } from "react";
import { useStore } from "@nanostores/react";
import { Copy, Gift, LogOut, Wallet } from "lucide-react";
import { $loyaltyProfile, logoutLoyalty, MOCK_PURCHASE_HISTORY, registerLoyalty } from "@/stores/loyalty";
import { whatsappLink } from "@/data/site";
import { formatMXN } from "@/lib/utils";
import QrPreview from "@/components/islands/QrPreview";

function RegisterForm() {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");

  return (
    <form
      className="glass mx-auto max-w-md space-y-4 rounded-2xl p-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (name.trim() && contact.trim()) registerLoyalty(name.trim(), contact.trim());
      }}
    >
      <div>
        <span className="text-3xl">💳</span>
        <h2 className="mt-2 text-lg font-bold">Únete al programa de fidelización</h2>
        <p className="mt-1 text-sm text-carrot-50/65">
          Regístrate con tu correo o teléfono y obtén 150 puntos de bienvenida más $50 en tu monedero.
        </p>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-semibold">Nombre completo</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full rounded-xl bg-carrot-50/10 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-carrot-400"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-semibold">Correo o número telefónico</label>
        <input
          type="text"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          required
          placeholder="tu@correo.com o 834 123 4567"
          className="w-full rounded-xl bg-carrot-50/10 px-4 py-2.5 text-sm placeholder:text-carrot-50/40 focus:outline-none focus:ring-2 focus:ring-carrot-400"
        />
      </div>
      <button
        type="submit"
        className="w-full rounded-full bg-carrot-500 py-3 text-sm font-semibold text-ink-950 transition hover:bg-carrot-400"
      >
        Crear mi cuenta
      </button>
    </form>
  );
}

export default function LoyaltyDashboard() {
  const profile = useStore($loyaltyProfile);
  const [copied, setCopied] = useState(false);

  if (!profile) return <RegisterForm />;

  function copyReferral() {
    if (!profile) return;
    navigator.clipboard?.writeText(profile.referralCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm text-carrot-50/60">Hola de nuevo,</p>
          <h2 className="text-2xl font-bold">{profile.name}</h2>
          <p className="text-xs text-carrot-50/50">Miembro desde {new Date(profile.joinedAt).toLocaleDateString("es-MX")}</p>
        </div>
        <button
          type="button"
          onClick={logoutLoyalty}
          className="glass glass-card flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-carrot-50/80"
        >
          <LogOut size={14} /> Cerrar sesión
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="glass-strong rounded-2xl p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-carrot-300">Puntos acumulados</p>
          <p className="mt-2 text-4xl font-bold">{profile.points}</p>
          <p className="mt-1 text-xs text-carrot-50/60">10% de cada compra regresa en puntos</p>
        </div>
        <div className="glass-strong rounded-2xl p-6">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-carrot-300">
            <Wallet size={13} /> Monedero electrónico
          </p>
          <p className="mt-2 text-4xl font-bold">{formatMXN(profile.walletBalance)}</p>
          <p className="mt-1 text-xs text-carrot-50/60">Úsalo como pago en tu próxima compra</p>
        </div>
        <div className="glass-strong rounded-2xl p-6">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-carrot-300">
            <Gift size={13} /> Gift cards
          </p>
          <p className="mt-2 text-4xl font-bold">{formatMXN(profile.giftCardBalance)}</p>
          <p className="mt-1 text-xs text-carrot-50/60">Regala una gift card a quien quieras</p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
        <div className="glass flex flex-col items-center rounded-2xl p-6 text-center">
          <p className="mb-3 text-sm font-semibold">Tu código QR de cliente</p>
          <QrPreview seed={profile.memberId} />
          <p className="mt-3 font-mono text-xs text-carrot-50/60">{profile.memberId}</p>
          <p className="mt-1 text-xs text-carrot-50/50">Muéstralo en caja para acumular y canjear puntos al instante.</p>
        </div>

        <div className="glass rounded-2xl p-6">
          <p className="mb-3 text-sm font-semibold">Historial de compras</p>
          <ul className="space-y-2">
            {MOCK_PURCHASE_HISTORY.map((h) => (
              <li key={h.date} className="flex items-center justify-between rounded-xl bg-carrot-50/5 p-3 text-sm">
                <div>
                  <p className="font-medium">{h.item}</p>
                  <p className="text-xs text-carrot-50/50">{h.date}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatMXN(h.total)}</p>
                  <p className="text-xs text-leaf-300">+{h.pointsEarned} pts</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="glass rounded-2xl p-6">
        <p className="text-sm font-semibold">Recomienda y gana</p>
        <p className="mt-1 text-sm text-carrot-50/65">
          Comparte tu código y recibe $100 en tu monedero cuando tu amigo haga su primera compra.
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <div className="glass flex flex-1 items-center justify-between rounded-xl px-4 py-2.5 font-mono text-sm">
            {profile.referralCode}
            <button type="button" onClick={copyReferral} className="text-carrot-300 hover:text-carrot-200">
              <Copy size={15} />
            </button>
          </div>
          <a
            href={whatsappLink(`¡Únete a Don Zanahorio con mi código ${profile.referralCode} y gana beneficios!`)}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl bg-leaf-500 px-5 py-2.5 text-center text-sm font-semibold text-ink-950 hover:bg-leaf-400"
          >
            Compartir por WhatsApp
          </a>
        </div>
        {copied && <p className="mt-2 text-xs text-leaf-300">Código copiado ✓</p>}
      </div>
    </div>
  );
}
