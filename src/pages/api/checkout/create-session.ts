import type { APIRoute } from "astro";
import Stripe from "stripe";

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
    shippingCost: number;
    discount: number;
  };

  if (!body.orderId || !Array.isArray(body.items) || body.items.length === 0) {
    return new Response(JSON.stringify({ error: "Pedido inválido." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

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

  if (body.shippingCost > 0) {
    lineItems.push({
      quantity: 1,
      price_data: {
        currency: "mxn",
        unit_amount: Math.round(body.shippingCost * 100),
        product_data: { name: "Envío" },
      },
    });
  }

  let discounts: Stripe.Checkout.SessionCreateParams.Discount[] | undefined;
  if (body.discount > 0) {
    const coupon = await stripe.coupons.create({
      amount_off: Math.round(body.discount * 100),
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
