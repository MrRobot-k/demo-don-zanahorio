import { useMemo, useState } from "react";
import { discountFor, WHOLESALE_ITEMS } from "@/data/wholesale";
import { SITE, whatsappLink } from "@/data/site";
import { submitWholesaleOrder } from "@/lib/queries";
import { cn, formatMXN } from "@/lib/utils";

type Fulfillment = "pickup" | "delivery";

export default function MayoreoForm() {
  const [itemId, setItemId] = useState(WHOLESALE_ITEMS[0].id);
  const [units, setUnits] = useState(WHOLESALE_ITEMS[0].minUnits);
  const [fulfillment, setFulfillment] = useState<Fulfillment>("pickup");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const item = WHOLESALE_ITEMS.find((i) => i.id === itemId)!;

  const quote = useMemo(() => {
    const discount = discountFor(units);
    const subtotal = units * item.pricePerUnit;
    const discountAmount = Math.round(subtotal * discount);
    const shipping = fulfillment === "delivery" ? SITE.shipping.baseCost * 2 : 0;
    const total = subtotal - discountAmount + shipping;
    return { discount, subtotal, discountAmount, shipping, total };
  }, [units, item, fulfillment]);

  const canSubmit = name.trim().length > 1 && phone.trim().length >= 10 && units >= item.minUnits;

  if (submitted) {
    const message = `¡Hola! Soy ${name}${company ? ` de ${company}` : ""}. Quiero cotizar ${units} ${item.unit}(s) de "${item.name}" para ${
      fulfillment === "pickup" ? "recoger en tienda" : "entrega a domicilio"
    }${eventDate ? `, fecha: ${eventDate}` : ""}. Cotización estimada: ${formatMXN(quote.total)}.`;

    return (
      <div className="glass-strong mx-auto max-w-lg rounded-3xl p-8 text-center">
        <span className="text-5xl">📦</span>
        <h2 className="mt-4 text-2xl font-bold">¡Solicitud recibida!</h2>
        <p className="mt-2 text-sm text-carrot-50/70">
          Nuestro equipo confirmará disponibilidad y te enviará la cotización final.
        </p>
        <a
          href={whatsappLink(message)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-block rounded-full bg-leaf-500 px-6 py-3 text-sm font-semibold text-ink-950 hover:bg-leaf-400"
        >
          Enviar detalles por WhatsApp
        </a>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <form
        className="glass space-y-5 rounded-2xl p-6"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!canSubmit) return;
          setSubmitting(true);
          setSubmitError("");
          try {
            await submitWholesaleOrder({
              customerName: name.trim(),
              company: company.trim() || null,
              phone: phone.trim(),
              itemName: item.name,
              units,
              unitPrice: item.pricePerUnit,
              fulfillmentType: fulfillment,
              eventDate: eventDate || null,
              notes: notes.trim() || null,
              quoteTotal: quote.total,
            });
            setSubmitted(true);
          } catch (err) {
            setSubmitError(err instanceof Error ? err.message : "No se pudo enviar tu solicitud. Intenta de nuevo.");
          } finally {
            setSubmitting(false);
          }
        }}
      >
        <div>
          <label className="mb-1.5 block text-sm font-semibold">Producto</label>
          <select
            value={itemId}
            onChange={(e) => {
              const next = WHOLESALE_ITEMS.find((i) => i.id === e.target.value)!;
              setItemId(next.id);
              setUnits(next.minUnits);
            }}
            className="w-full rounded-xl bg-carrot-50/10 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-carrot-400"
          >
            {WHOLESALE_ITEMS.map((i) => (
              <option className="bg-ink-900" key={i.id} value={i.id}>
                {i.name} — {formatMXN(i.pricePerUnit)}/{i.unit}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold">
            Cantidad ({item.unit}s, mínimo {item.minUnits})
          </label>
          <input
            type="number"
            min={item.minUnits}
            value={units}
            onChange={(e) => setUnits(Math.max(item.minUnits, Number(e.target.value) || item.minUnits))}
            className="w-full rounded-xl bg-carrot-50/10 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-carrot-400"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          {(["pickup", "delivery"] as Fulfillment[]).map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setFulfillment(opt)}
              className={cn(
                "rounded-xl px-4 py-2.5 text-sm font-medium transition",
                fulfillment === opt ? "bg-carrot-500 text-ink-950" : "bg-carrot-50/10 text-carrot-50/75 hover:bg-carrot-50/20"
              )}
            >
              {opt === "pickup" ? "🏬 Recoger en tienda" : "🚚 Entrega a domicilio"}
            </button>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
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
            <label className="mb-1.5 block text-sm font-semibold">Empresa (opcional)</label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full rounded-xl bg-carrot-50/10 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-carrot-400"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold">Teléfono</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="w-full rounded-xl bg-carrot-50/10 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-carrot-400"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold">Fecha del evento</label>
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="w-full rounded-xl bg-carrot-50/10 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-carrot-400"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold">Notas adicionales</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full rounded-xl bg-carrot-50/10 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-carrot-400"
          />
        </div>

        {submitError && <p className="text-sm text-red-400">{submitError}</p>}

        <button
          type="submit"
          disabled={!canSubmit || submitting}
          className="w-full rounded-full bg-carrot-500 py-3 text-sm font-semibold text-ink-950 transition hover:bg-carrot-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting ? "Enviando..." : "Solicitar cotización"}
        </button>
      </form>

      <div className="glass-strong h-fit rounded-2xl p-6">
        <h2 className="mb-4 text-lg font-semibold">Cotización estimada</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between text-carrot-50/70">
            <dt>
              {units} × {formatMXN(item.pricePerUnit)}
            </dt>
            <dd>{formatMXN(quote.subtotal)}</dd>
          </div>
          {quote.discount > 0 && (
            <div className="flex justify-between text-leaf-300">
              <dt>Descuento por volumen ({Math.round(quote.discount * 100)}%)</dt>
              <dd>-{formatMXN(quote.discountAmount)}</dd>
            </div>
          )}
          <div className="flex justify-between text-carrot-50/70">
            <dt>Envío</dt>
            <dd>{quote.shipping === 0 ? "Incluido" : formatMXN(quote.shipping)}</dd>
          </div>
          <div className="flex justify-between border-t border-carrot-50/15 pt-3 text-base font-bold">
            <dt>Total estimado</dt>
            <dd>{formatMXN(quote.total)}</dd>
          </div>
        </dl>
        <p className="mt-4 text-xs text-carrot-50/50">
          Cotización sujeta a confirmación final. Descuentos por volumen: 5% desde 20 unidades, 10% desde 50, 15% desde 100.
        </p>
      </div>
    </div>
  );
}
