import type { APIRoute } from "astro";
import Stripe from "stripe";
import { supabase } from "@/lib/supabase";
import { computeShippingCost } from "@/lib/shipping";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const secretKey = import.meta.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return new Response(
      JSON.stringify({ error: "Los pagos con tarjeta no están configurados en este entorno (falta STRIPE_SECRET_KEY)." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const body = (await request.json()) as {
    orderId: string;
    items: Array<{ name: string; price: number; qty: number }>;
    couponCode: string | null;
    contact: string | null;
    subscriptionDiscount: number;
  };

  if (!body.orderId || !Array.isArray(body.items) || body.items.length === 0) {
    return new Response(JSON.stringify({ error: "Pedido inválido." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Recompute shipping and the coupon discount from the order already
  // persisted server-side, instead of trusting the numbers in this request
  // body -- otherwise a personal, single-use coupon would be trivially
  // spoofable by anyone who can read its code.
  const { data: order, error: orderError } = await supabase.rpc("get_order_for_checkout", { p_order_id: body.orderId });
  if (orderError || !order) {
    return new Response(JSON.stringify({ error: "No se encontró el pedido." }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const subtotal = Number(order.subtotal);
  const shippingCost = computeShippingCost({
    fulfillment: order.fulfillmentType,
    subtotal,
    zone: order.distanceKm != null ? { id: "", name: "", distanceKm: Number(order.distanceKm) } : null,
  }).cost;

  let couponDiscount = 0;
  if (body.couponCode) {
    const { data: validated } = await supabase.rpc("validate_coupon", {
      p_code: body.couponCode,
      p_contact: body.contact ?? null,
    });
    if (validated?.discountPercent) {
      couponDiscount = Math.round(subtotal * (validated.discountPercent / 100));
    }
  }
  const discount = couponDiscount + Math.max(0, Number(body.subscriptionDiscount) || 0);

  const stripe = new Stripe(secretKey);
  const origin = request.headers.get("origin") ?? new URL(request.url).origin;

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = body.items.map((item) => ({
    quantity: item.qty,
    price_data: {
      currency: "mxn",
      unit_amount: Math.round(item.price * 100),
      product_data: { name: item.name },
    },
  }));

  if (shippingCost > 0) {
    lineItems.push({
      quantity: 1,
      price_data: {
        currency: "mxn",
        unit_amount: Math.round(shippingCost * 100),
        product_data: { name: "Envío" },
      },
    });
  }

  let discounts: Stripe.Checkout.SessionCreateParams.Discount[] | undefined;
  if (discount > 0) {
    const coupon = await stripe.coupons.create({
      amount_off: Math.round(discount * 100),
      currency: "mxn",
      duration: "once",
    });
    discounts = [{ coupon: coupon.id }];
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      discounts,
      success_url: `${origin}/carrito/exito?session_id={CHECKOUT_SESSION_ID}&order=${body.orderId}`,
      cancel_url: `${origin}/carrito`,
      metadata: { orderId: body.orderId },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "No se pudo iniciar el pago." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
