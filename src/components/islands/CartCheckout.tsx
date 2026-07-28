import { useMemo, useState } from "react";
import { useStore } from "@nanostores/react";
import { Minus, Plus, ShoppingBasket, Trash2 } from "lucide-react";
import { $cartLines, $cartTotal, clearCart, removeFromCart, setQty } from "@/stores/cart";
import { SITE, whatsappLink } from "@/data/site";
import { fetchCoupons, submitOrder } from "@/lib/queries";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { cn, formatMXN } from "@/lib/utils";

type Fulfillment = "pickup" | "delivery";
type Payment = "card" | "cash";

export default function CartCheckout() {
  const lines = useStore($cartLines);
  const subtotal = useStore($cartTotal);
  const { data: coupons } = useSupabaseData(fetchCoupons);

  const [fulfillment, setFulfillment] = useState<Fulfillment>("pickup");
  const [payment, setPayment] = useState<Payment>("card");
  const [address, setAddress] = useState("");
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponNote, setCouponNote] = useState("");
  const [couponError, setCouponError] = useState("");
  const [confirmedOrder, setConfirmedOrder] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const shipping = useMemo(() => {
    if (fulfillment === "pickup" || lines.length === 0) return 0;
    if (subtotal >= SITE.shipping.freeThreshold) return 0;
    return SITE.shipping.baseCost;
  }, [fulfillment, subtotal, lines.length]);

  const discount = useMemo(() => {
    if (!appliedCoupon) return 0;
    const match = coupons?.find((c) => c.code === appliedCoupon);
    if (!match?.discountPercent) return 0;
    return Math.round(subtotal * (match.discountPercent / 100));
  }, [appliedCoupon, coupons, subtotal]);

  const total = Math.max(subtotal + shipping - discount, 0);

  function applyCoupon() {
    const code = couponInput.trim().toUpperCase();
    const match = coupons?.find((c) => c.code === code);
    if (!match) {
      setCouponError("Cupón no válido o vencido.");
      setCouponNote("");
      setAppliedCoupon(null);
      return;
    }
    setCouponError("");
    setAppliedCoupon(code);
    setCouponNote(match.discountPercent ? "" : `Este cupón (${match.discount}) se aplica directamente en tienda.`);
  }

  async function confirmOrder() {
    if (fulfillment === "delivery" && address.trim().length < 6) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      await submitOrder({
        fulfillmentType: fulfillment,
        address: fulfillment === "delivery" ? address.trim() : null,
        paymentMethod: payment,
        subtotal,
        shippingCost: shipping,
        discount,
        couponCode: appliedCoupon,
        total,
        items: lines.map((l) => ({ name: l.name, price: l.price, qty: l.qty })),
      });
      const orderNumber = Math.floor(1000 + Math.random() * 9000);
      setConfirmedOrder(orderNumber);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "No se pudo registrar tu pedido. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmedOrder) {
    const summary = lines.map((l) => `${l.qty}x ${l.name}`).join(", ");
    const message = `¡Hola! Confirmo mi pedido #${confirmedOrder} (${
      fulfillment === "pickup" ? "recoger en tienda" : "a domicilio"
    }): ${summary}. Total: ${formatMXN(total)}. Pago: ${payment === "card" ? "tarjeta" : "efectivo"}.`;

    return (
      <div className="glass-strong mx-auto max-w-lg rounded-3xl p-8 text-center">
        <span className="text-5xl">✅</span>
        <h2 className="mt-4 text-2xl font-bold">¡Pedido #{confirmedOrder} confirmado!</h2>
        <p className="mt-2 text-sm text-carrot-50/70">
          {fulfillment === "pickup"
            ? "Te esperamos en tienda para recoger tu pedido."
            : "Tu pedido va en camino a la dirección indicada."}{" "}
          Recibirás la confirmación final por WhatsApp.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <a
            href={whatsappLink(message)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => clearCart()}
            className="rounded-full bg-leaf-500 px-6 py-3 text-sm font-semibold text-ink-950 hover:bg-leaf-400"
          >
            Confirmar por WhatsApp
          </a>
          <a
            href="/menu"
            onClick={() => clearCart()}
            className="glass glass-card rounded-full px-6 py-3 text-sm font-semibold text-carrot-50"
          >
            Seguir explorando el menú
          </a>
        </div>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="glass mx-auto max-w-lg rounded-3xl p-10 text-center">
        <ShoppingBasket className="mx-auto text-carrot-300" size={40} />
        <h2 className="mt-4 text-xl font-bold">Tu carrito está vacío</h2>
        <p className="mt-2 text-sm text-carrot-50/70">Agrega platillos desde el menú para comenzar tu pedido.</p>
        <a
          href="/menu"
          className="mt-6 inline-block rounded-full bg-carrot-500 px-6 py-3 text-sm font-semibold text-ink-950 hover:bg-carrot-400"
        >
          Ir al menú
        </a>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <div className="glass rounded-2xl p-5">
        <h2 className="mb-4 text-lg font-semibold">Tu pedido</h2>
        <ul className="space-y-3">
          {lines.map((line) => (
            <li key={line.id} className="flex items-center gap-3 rounded-xl bg-carrot-50/5 p-3">
              <span className="text-2xl">{line.emoji}</span>
              <div className="flex-1">
                <p className="text-sm font-medium">{line.name}</p>
                <p className="text-xs text-carrot-50/60">{formatMXN(line.price)} c/u</p>
              </div>
              <div className="glass flex items-center gap-2 rounded-full px-2 py-1">
                <button
                  type="button"
                  aria-label="Quitar uno"
                  onClick={() => setQty(line.id, line.qty - 1)}
                  className="grid h-6 w-6 place-items-center rounded-full bg-carrot-50/10 hover:bg-carrot-50/20"
                >
                  <Minus size={12} />
                </button>
                <span className="w-4 text-center text-xs font-semibold">{line.qty}</span>
                <button
                  type="button"
                  aria-label="Agregar uno"
                  onClick={() => setQty(line.id, line.qty + 1)}
                  className="grid h-6 w-6 place-items-center rounded-full bg-carrot-500 text-ink-950 hover:bg-carrot-400"
                >
                  <Plus size={12} />
                </button>
              </div>
              <button
                type="button"
                aria-label="Eliminar"
                onClick={() => removeFromCart(line.id)}
                className="text-carrot-50/40 hover:text-red-400"
              >
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>

        <div className="mt-6">
          <p className="mb-2 text-sm font-semibold">Entrega</p>
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
                {opt === "pickup" ? "🏬 Recoger en tienda" : "🚚 A domicilio"}
              </button>
            ))}
          </div>
          {fulfillment === "delivery" && (
            <div className="mt-3">
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Dirección de entrega en Ciudad Victoria"
                className="w-full rounded-xl bg-carrot-50/10 px-4 py-2.5 text-sm placeholder:text-carrot-50/40 focus:outline-none focus:ring-2 focus:ring-carrot-400"
              />
              <p className="mt-1.5 text-xs text-carrot-50/50">
                Envío gratis en pedidos desde {formatMXN(SITE.shipping.freeThreshold)}.
              </p>
            </div>
          )}
        </div>

        <div className="mt-6">
          <p className="mb-2 text-sm font-semibold">Método de pago</p>
          <div className="grid grid-cols-2 gap-2">
            {(["card", "cash"] as Payment[]).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setPayment(opt)}
                className={cn(
                  "rounded-xl px-4 py-2.5 text-sm font-medium transition",
                  payment === opt ? "bg-carrot-500 text-ink-950" : "bg-carrot-50/10 text-carrot-50/75 hover:bg-carrot-50/20"
                )}
              >
                {opt === "card" ? "💳 Tarjeta" : "💵 Efectivo"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="glass-strong h-fit rounded-2xl p-5">
        <h2 className="mb-4 text-lg font-semibold">Resumen</h2>

        <div className="flex gap-2">
          <input
            type="text"
            value={couponInput}
            onChange={(e) => setCouponInput(e.target.value)}
            placeholder="Código de cupón"
            className="flex-1 rounded-xl bg-carrot-50/10 px-3 py-2 text-sm uppercase placeholder:normal-case placeholder:text-carrot-50/40 focus:outline-none focus:ring-2 focus:ring-carrot-400"
          />
          <button
            type="button"
            onClick={applyCoupon}
            className="rounded-xl bg-carrot-50/15 px-4 text-sm font-semibold hover:bg-carrot-50/25"
          >
            Aplicar
          </button>
        </div>
        {couponError && <p className="mt-1.5 text-xs text-red-400">{couponError}</p>}
        {appliedCoupon && <p className="mt-1.5 text-xs text-leaf-300">Cupón {appliedCoupon} aplicado ✓</p>}
        {couponNote && <p className="mt-1 text-xs text-carrot-50/50">{couponNote}</p>}

        <dl className="mt-5 space-y-2 text-sm">
          <div className="flex justify-between text-carrot-50/70">
            <dt>Subtotal</dt>
            <dd>{formatMXN(subtotal)}</dd>
          </div>
          <div className="flex justify-between text-carrot-50/70">
            <dt>Envío</dt>
            <dd>{shipping === 0 ? "Gratis" : formatMXN(shipping)}</dd>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-leaf-300">
              <dt>Descuento</dt>
              <dd>-{formatMXN(discount)}</dd>
            </div>
          )}
          <div className="flex justify-between border-t border-carrot-50/15 pt-3 text-base font-bold">
            <dt>Total</dt>
            <dd>{formatMXN(total)}</dd>
          </div>
        </dl>

        {submitError && <p className="mt-3 text-xs text-red-400">{submitError}</p>}

        <button
          type="button"
          onClick={confirmOrder}
          disabled={submitting || (fulfillment === "delivery" && address.trim().length < 6)}
          className="mt-6 w-full rounded-full bg-carrot-500 py-3 text-sm font-semibold text-ink-950 transition hover:bg-carrot-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting ? "Enviando..." : "Confirmar pedido"}
        </button>
      </div>
    </div>
  );
}
