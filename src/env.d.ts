/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_SUPABASE_URL: string;
  readonly PUBLIC_SUPABASE_ANON_KEY: string;
  /** Server-only: never referenced from client components. */
  readonly STRIPE_SECRET_KEY: string;
  /** Server-only: shared secret so only our own server can confirm a Stripe payment via mark_order_paid(). */
  readonly INTERNAL_RPC_SECRET: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
