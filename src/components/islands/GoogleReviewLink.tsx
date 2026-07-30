import { useState } from "react";
import { SITE } from "@/data/site";
import { claimGoogleReviewReward, fetchReviewRewardConfig } from "@/lib/queries";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { cn } from "@/lib/utils";

export default function GoogleReviewLink({ className }: { className?: string }) {
  const { data: config } = useSupabaseData(fetchReviewRewardConfig);
  const [contact, setContact] = useState("");
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState("");
  const [reward, setReward] = useState<{ code: string; discountPercent: number } | null>(null);

  async function claim() {
    if (contact.trim().length < 5) {
      setError("Ingresa tu correo o teléfono registrado en Fidelización.");
      return;
    }
    setClaiming(true);
    setError("");
    try {
      const result = await claimGoogleReviewReward(contact.trim());
      setReward({ code: result.code, discountPercent: result.discountPercent });
      window.open(SITE.googleReviewUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo generar tu cupón. Intenta de nuevo.");
    } finally {
      setClaiming(false);
    }
  }

  if (reward) {
    return (
      <div className={cn("glass rounded-2xl p-4 text-center", className)}>
        <p className="text-sm text-carrot-50/80">Gracias. Aquí está tu cupón de {reward.discountPercent}% de descuento:</p>
        <p className="mt-2 font-mono text-lg font-bold text-carrot-300">{reward.code}</p>
        <p className="mt-1 text-xs text-carrot-50/50">Aplícalo en tu próximo pedido desde el carrito.</p>
      </div>
    );
  }

  return (
    <div className={cn("mx-auto max-w-sm space-y-2", className)}>
      <input
        type="text"
        value={contact}
        onChange={(e) => setContact(e.target.value)}
        placeholder="Tu correo o teléfono de Fidelización"
        className="w-full rounded-xl bg-carrot-50/10 px-4 py-2.5 text-sm placeholder:text-carrot-50/40 focus:outline-none focus:ring-2 focus:ring-carrot-400"
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
      <button
        type="button"
        onClick={claim}
        disabled={claiming}
        className="inline-block w-full rounded-full bg-carrot-500 px-6 py-3 text-sm font-semibold text-ink-950 hover:bg-carrot-400 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {claiming ? "Generando cupón..." : `Escribir reseña en Google${config ? ` y ganar ${config.discountPercent}%` : ""}`}
      </button>
    </div>
  );
}
