import { SITE } from "@/data/site";

export type DeliveryZone = { id: string; name: string; distanceKm: number };

export type ShippingResult = {
  cost: number;
  distanceKm: number | null;
  freeReason: string | null;
};

/**
 * Single source of truth for shipping cost (section 2.1: "configuración
 * automática de costo de envío"), shared by the online cart and wholesale
 * quotes so they never diverge again. `perKm` finally gets used here.
 */
export function computeShippingCost(params: {
  fulfillment: "pickup" | "delivery";
  subtotal: number;
  zone: DeliveryZone | null;
  isWholesale?: boolean;
}): ShippingResult {
  const { fulfillment, subtotal, zone, isWholesale = false } = params;

  if (fulfillment === "pickup") {
    return { cost: 0, distanceKm: null, freeReason: null };
  }

  if (!isWholesale && subtotal >= SITE.shipping.freeThreshold) {
    return {
      cost: 0,
      distanceKm: zone?.distanceKm ?? null,
      freeReason: `Envío gratis en pedidos desde ${SITE.shipping.freeThreshold}`,
    };
  }

  const base = isWholesale ? SITE.shipping.baseCost * 2 : SITE.shipping.baseCost;
  const distanceKm = zone?.distanceKm ?? null;
  const cost = Math.round(base + (distanceKm ?? 0) * SITE.shipping.perKm);

  return { cost, distanceKm, freeReason: null };
}
