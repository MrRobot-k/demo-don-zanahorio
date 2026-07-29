/**
 * Preferential pricing granted by an active subscription plan (section 2.3
 * of the client's requirements: "aplicable para consumo en sucursal o
 * servicio a domicilio"). Shared between the online cart and POS so the
 * same customer gets the same benefit either way.
 *
 * comida-semanal's own perk ("20% de descuento en pedidos de mayoreo") is
 * intentionally not handled here — it applies to wholesale quotes, not a
 * line-item purchase, and Mayoreo has no customer-lookup field yet.
 */
export type SubscriptionDiscount = { amount: number; label: string };

export function computeSubscriptionDiscount(
  planSlug: string | null | undefined,
  lines: Array<{ name: string; price: number }>,
  subtotal: number
): SubscriptionDiscount | null {
  if (!planSlug || subtotal <= 0) return null;

  if (planSlug === "jugo-diario") {
    return { amount: Math.round(subtotal * 0.1), label: "Jugo Diario: 10% en el resto del menú" };
  }

  if (planSlug === "cafe-diario") {
    const coffeeLine = lines.find((l) => /caf[eé]/i.test(l.name));
    if (!coffeeLine) return null;
    return { amount: Math.round(coffeeLine.price), label: "Café Diario: 1 café gratis hoy" };
  }

  return null;
}
