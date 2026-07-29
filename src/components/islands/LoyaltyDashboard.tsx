import { useEffect, useState } from "react";
import { useStore } from "@nanostores/react";
import { Copy, Gift, LogOut, Wallet } from "lucide-react";
import {
  $loyaltyProfile,
  $loyaltyLoading,
  logoutLoyalty,
  registerLoyalty,
  loginLoyalty,
  restoreLoyaltySession,
} from "@/stores/loyalty";
import { sendGiftCard } from "@/lib/queries";
import { whatsappLink } from "@/data/site";
import { formatMXN } from "@/lib/utils";
import QrPreview from "@/components/islands/QrPreview";

function GiftCardForm({ senderContact }: { senderContact: string }) {
  const [open, setOpen] = useState(false);
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 w-full rounded-full bg-carrot-50/10 py-2 text-xs font-semibold text-carrot-50/80 hover:bg-carrot-50/20"
      >
        Regalar gift card
      </button>
    );
  }

  if (sent) {
    return <p className="mt-3 text-xs text-leaf-300">¡Gift card enviada! ✓</p>;
  }

  return (
    <form
      className="mt-3 space-y-2"
      onSubmit={async (e) => {
        e.preventDefault();
        setSending(true);
        setError("");
        try {
          await sendGiftCard(senderContact, recipient.trim(), Number(amount));
          await restoreLoyaltySession();
          setSent(true);
          setTimeout(() => {
            setOpen(false);
            setSent(false);
            setRecipient("");
            setAmount("");
          }, 1800);
        } catch (err) {
          setError(err instanceof Error ? err.message : "No se pudo enviar la gift card.");
        } finally {
          setSending(false);
        }
      }}
    >
      <input
        type="text"
        required
        value={recipient}
        onChange={(e) => setRecipient(e.target.value)}
        placeholder="Correo o teléfono del destinatario"
        className="w-full rounded-lg bg-carrot-50/10 px-3 py-2 text-xs placeholder:text-carrot-50/40 focus:outline-none focus:ring-2 focus:ring-carrot-400"
      />
      <input
        type="number"
        required
        min={1}
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Monto"
        className="w-full rounded-lg bg-carrot-50/10 px-3 py-2 text-xs placeholder:text-carrot-50/40 focus:outline-none focus:ring-2 focus:ring-carrot-400"
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={sending}
        className="w-full rounded-full bg-carrot-500 py-2 text-xs font-semibold text-ink-950 hover:bg-carrot-400 disabled:opacity-40"
      >
        {sending ? "Enviando..." : "Enviar gift card"}
      </button>
    </form>
  );
}

function AuthPanel() {
  const [mode, setMode] = useState<"register" | "login">("register");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      if (mode === "register") {
        if (!name.trim() || !contact.trim()) return;
        await registerLoyalty(name.trim(), contact.trim(), referralCode.trim() || undefined);
      } else {
        if (!contact.trim()) return;
        await loginLoyalty(contact.trim());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo salió mal. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="glass mx-auto max-w-md rounded-2xl p-6">
      <div className="mb-5 grid grid-cols-2 gap-2 rounded-full bg-carrot-50/10 p-1 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setMode("register")}
          className={`rounded-full py-2 transition ${mode === "register" ? "bg-carrot-500 text-ink-950" : "text-carrot-50/70"}`}
        >
          Crear cuenta
        </button>
        <button
          type="button"
          onClick={() => setMode("login")}
          className={`rounded-full py-2 transition ${mode === "login" ? "bg-carrot-500 text-ink-950" : "text-carrot-50/70"}`}
        >
          Ya tengo cuenta
        </button>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <span className="text-3xl">💳</span>
          <h2 className="mt-2 text-lg font-bold">
            {mode === "register" ? "Únete al programa de fidelización" : "Accede a tu monedero"}
          </h2>
          <p className="mt-1 text-sm text-carrot-50/65">
            {mode === "register"
              ? "Regístrate con tu correo o teléfono y obtén 150 puntos de bienvenida más $50 en tu monedero."
              : "Ingresa el correo o teléfono con el que te registraste."}
          </p>
        </div>

        {mode === "register" && (
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
        )}

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

        {mode === "register" && (
          <div>
            <label className="mb-1.5 block text-sm font-semibold">Código de referido (opcional)</label>
            <input
              type="text"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value)}
              placeholder="AMIGO1234"
              className="w-full rounded-xl bg-carrot-50/10 px-4 py-2.5 text-sm uppercase placeholder:normal-case placeholder:text-carrot-50/40 focus:outline-none focus:ring-2 focus:ring-carrot-400"
            />
          </div>
        )}

        {error && <p className="text-xs text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-carrot-500 py-3 text-sm font-semibold text-ink-950 transition hover:bg-carrot-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting ? "Enviando..." : mode === "register" ? "Crear mi cuenta" : "Entrar"}
        </button>
      </form>
    </div>
  );
}

export default function LoyaltyDashboard() {
  const profile = useStore($loyaltyProfile);
  const loading = useStore($loyaltyLoading);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    restoreLoyaltySession();
  }, []);

  // Only show the full-screen loader for the *first* load. Background
  // refreshes (e.g. GiftCardForm calling restoreLoyaltySession() after a
  // transfer) also flip `loading`, and unmounting the whole dashboard for
  // those discards in-flight local state in children like GiftCardForm —
  // its confirmation message would fire on an already-unmounted instance.
  if (loading && !profile) {
    return <p className="mt-8 text-center text-sm text-carrot-50/60">Cargando tu cuenta...</p>;
  }

  if (!profile) return <AuthPanel />;

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
          <p className="mt-1 text-xs text-carrot-50/60">Envía saldo de tu monedero como gift card</p>
          <GiftCardForm senderContact={profile.email ?? profile.phone ?? ""} />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
        <div className="glass flex flex-col items-center rounded-2xl p-6 text-center">
          <p className="mb-3 text-sm font-semibold">Tu código QR de cliente</p>
          <QrPreview seed={profile.memberCode} />
          <p className="mt-3 font-mono text-xs text-carrot-50/60">{profile.memberCode}</p>
          <p className="mt-1 text-xs text-carrot-50/50">Muéstralo en caja para acumular y canjear puntos al instante.</p>
        </div>

        <div className="glass rounded-2xl p-6">
          <p className="mb-3 text-sm font-semibold">Historial de compras</p>
          {profile.purchaseHistory.length === 0 ? (
            <p className="text-sm text-carrot-50/50">Aún no tienes compras registradas con tu cuenta de fidelización.</p>
          ) : (
            <ul className="space-y-2">
              {profile.purchaseHistory.map((h) => (
                <li key={h.orderId} className="flex items-center justify-between rounded-xl bg-carrot-50/5 p-3 text-sm">
                  <div>
                    <p className="font-medium">Pedido #{h.orderId.slice(0, 8)}</p>
                    <p className="text-xs text-carrot-50/50">{new Date(h.date).toLocaleDateString("es-MX")}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatMXN(h.total)}</p>
                    <p className="text-xs text-leaf-300">+{h.pointsEarned} pts</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
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
