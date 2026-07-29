import { useState } from "react";
import { useStore } from "@nanostores/react";
import { Check } from "lucide-react";
import { $loyaltyProfile, activatePlan } from "@/stores/loyalty";
import type { Plan } from "@/data/plans";
import { cn, formatMXN } from "@/lib/utils";

export default function PlanCard({ plan }: { plan: Plan }) {
  const profile = useStore($loyaltyProfile);
  const isActive = profile?.activePlanId === plan.id;
  const [activating, setActivating] = useState(false);
  const [error, setError] = useState("");

  async function handleActivate() {
    setActivating(true);
    setError("");
    try {
      await activatePlan(plan.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo activar el plan.");
    } finally {
      setActivating(false);
    }
  }

  return (
    <div
      className={cn(
        "glass glass-card flex flex-col rounded-2xl p-6",
        plan.highlight && "border-carrot-400/50 ring-1 ring-carrot-400/30"
      )}
    >
      {plan.highlight && (
        <span className="mb-3 w-fit rounded-full bg-carrot-500/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-carrot-300">
          Más popular
        </span>
      )}
      <span className="text-4xl">{plan.emoji}</span>
      <h3 className="mt-3 text-lg font-bold">{plan.name}</h3>
      <p className="text-sm text-carrot-50/60">{plan.perk}</p>
      <p className="mt-4 text-3xl font-bold">
        {formatMXN(plan.price)}
        <span className="text-sm font-normal text-carrot-50/50">/{plan.period}</span>
      </p>
      <ul className="mt-5 flex-1 space-y-2 text-sm text-carrot-50/75">
        {plan.benefits.map((b) => (
          <li key={b} className="flex items-start gap-2">
            <Check size={15} className="mt-0.5 shrink-0 text-leaf-300" />
            {b}
          </li>
        ))}
      </ul>

      {isActive ? (
        <div className="mt-6 rounded-full bg-leaf-500/20 py-2.5 text-center text-sm font-semibold text-leaf-300">
          Plan activo ✓
        </div>
      ) : profile ? (
        <>
          <button
            type="button"
            onClick={handleActivate}
            disabled={activating}
            className="mt-6 rounded-full bg-carrot-500 py-2.5 text-sm font-semibold text-ink-950 transition hover:bg-carrot-400 disabled:opacity-40"
          >
            {activating ? "Activando..." : "Activar suscripción"}
          </button>
          {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
        </>
      ) : (
        <a
          href="/fidelizacion"
          className="mt-6 rounded-full bg-carrot-50/10 py-2.5 text-center text-sm font-semibold text-carrot-50/80 hover:bg-carrot-50/20"
        >
          Regístrate para suscribirte
        </a>
      )}
    </div>
  );
}
