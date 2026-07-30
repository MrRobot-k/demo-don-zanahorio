import type { APIRoute } from 'astro';
import Stripe from 'stripe';

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY);

export const POST: APIRoute = async ({ request }) => {
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return new Response('Falta la firma de Stripe', { status: 400 });
  }

  try {
    // Leemos el body crudo en texto para validar la firma
    const rawBody = await request.text();
    const event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      import.meta.env.STRIPE_WEBHOOK_SECRET
    );

    // Manejo de eventos según lo que necesites
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        // AQUÍ: Marcar pedido como pagado o activar beneficios iniciales
        console.log('Pago recibido exitosamente:', session.id);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        // AQUÍ: Actualizar el estado del usuario/cliente a "Suscripción Activa" en Supabase
        console.log('Suscripción activa para cliente:', subscription.customer);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        // AQUÍ: Revocar acceso a la membresía en tu BD
        console.log('Suscripción cancelada:', subscription.id);
        break;
      }

      default:
        console.log(`Evento no manejado: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (err: any) {
    console.error(`Error de Webhook: ${err.message}`);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }
};
