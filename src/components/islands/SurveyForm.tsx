import { useState } from "react";
import StarRating from "@/components/islands/StarRating";
import GoogleReviewLink from "@/components/islands/GoogleReviewLink";
import { SITE } from "@/data/site";
import { fetchCashiers, submitSurvey } from "@/lib/queries";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { cn } from "@/lib/utils";

export default function SurveyForm() {
  const { data: cashiers, error: cashiersError, loading: cashiersLoading } = useSupabaseData(fetchCashiers);
  const [branchRating, setBranchRating] = useState(0);
  const [serviceRating, setServiceRating] = useState(0);
  const [cashierId, setCashierId] = useState<string | null>(null);
  const [comments, setComments] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const canSubmit = branchRating > 0 && serviceRating > 0;

  if (submitted) {
    return (
      <div className="glass-strong mx-auto max-w-lg rounded-3xl p-8 text-center">
        <span className="text-5xl">🙌</span>
        <h2 className="mt-4 text-2xl font-bold">¡Gracias por tu opinión!</h2>
        <p className="mt-2 text-sm text-carrot-50/70">
          Tu encuesta ayuda a mejorar el servicio y a reconocer a nuestro equipo. Como agradecimiento, comparte tu
          experiencia también en Google y recibe un cupón especial.
        </p>
        <GoogleReviewLink className="mt-6" />
      </div>
    );
  }

  return (
    <form
      className="glass mx-auto max-w-xl space-y-7 rounded-2xl p-6 sm:p-8"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!canSubmit) return;
        setSubmitting(true);
        setSubmitError("");
        try {
          await submitSurvey({
            branchRating,
            serviceRating,
            cashierId,
            comments: comments.trim() || null,
          });
          setSubmitted(true);
        } catch (err) {
          setSubmitError(err instanceof Error ? err.message : "No se pudo enviar tu encuesta. Intenta de nuevo.");
        } finally {
          setSubmitting(false);
        }
      }}
    >
      <div>
        <p className="mb-2 text-sm font-semibold">¿Cómo calificas la sucursal ({SITE.city})?</p>
        <StarRating value={branchRating} onChange={setBranchRating} />
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold">¿Cómo calificas el servicio recibido?</p>
        <StarRating value={serviceRating} onChange={setServiceRating} />
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold">Vota por tu cajero(a) favorito(a)</p>
        {cashiersLoading ? (
          <p className="text-xs text-carrot-50/50">Cargando cajeros...</p>
        ) : cashiersError ? (
          <p className="text-xs text-red-400">{cashiersError}</p>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {cashiers?.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCashierId(c.id)}
                className={cn(
                  "rounded-xl p-3 text-center text-xs transition",
                  cashierId === c.id ? "bg-carrot-500 text-ink-950" : "bg-carrot-50/10 text-carrot-50/75 hover:bg-carrot-50/20"
                )}
              >
                <span className="block text-xl">{c.emoji}</span>
                <span className="mt-1 block font-semibold">{c.name}</span>
              </button>
            ))}
          </div>
        )}
        <p className="mt-2 text-xs text-carrot-50/50">
          Los votos alimentan el sistema de incentivos y bonos del personal.
        </p>
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold">Comentarios (opcional)</label>
        <textarea
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          rows={3}
          placeholder="Cuéntanos más sobre tu visita..."
          className="w-full rounded-xl bg-carrot-50/10 px-4 py-2.5 text-sm placeholder:text-carrot-50/40 focus:outline-none focus:ring-2 focus:ring-carrot-400"
        />
      </div>

      {submitError && <p className="text-sm text-red-400">{submitError}</p>}

      <button
        type="submit"
        disabled={!canSubmit || submitting}
        className="w-full rounded-full bg-carrot-500 py-3 text-sm font-semibold text-ink-950 transition hover:bg-carrot-400 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {submitting ? "Enviando..." : "Enviar encuesta"}
      </button>
    </form>
  );
}
