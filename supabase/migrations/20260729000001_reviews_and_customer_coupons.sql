-- Personal, single-use coupons (e.g. issued as a Google review reward)
create table public.customer_coupons (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id),
  code text not null unique,
  title text not null,
  discount_percent numeric not null check (discount_percent > 0 and discount_percent <= 100),
  source text not null default 'google_review' check (source in ('google_review','manual','promo')),
  expires_at date,
  redeemed_at timestamptz,
  redeemed_order_id uuid references public.orders(id),
  created_at timestamptz not null default now()
);
create index customer_coupons_customer_id_idx on public.customer_coupons (customer_id);

alter table public.customer_coupons enable row level security;
create policy "admins read all customer coupons" on public.customer_coupons
  for select using (public.is_admin_employee());

-- Singleton config for the Google-review reward program
create table public.review_reward_config (
  id int primary key default 1 check (id = 1),
  discount_percent numeric not null default 15,
  valid_days int not null default 30,
  cooldown_days int not null default 90,
  active boolean not null default true
);
insert into public.review_reward_config (id) values (1);

alter table public.review_reward_config enable row level security;
create policy "public read review reward config" on public.review_reward_config
  for select using (true);
create policy "admins manage review reward config" on public.review_reward_config
  for all using (public.is_admin_employee()) with check (public.is_admin_employee());

-- Claim the review reward: registers who reviewed (google_reviews.customer_id) and
-- issues a personal one-time coupon, atomically.
create or replace function public.claim_google_review_reward(p_contact text)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  cust public.customers;
  cfg public.review_reward_config;
  new_code text;
  new_expires date;
  last_claim timestamptz;
begin
  select * into cust from public.customers
   where lower(email) = lower(trim(p_contact)) or phone = trim(p_contact)
   limit 1;
  if cust.id is null then
    raise exception 'cuenta_no_encontrada';
  end if;

  select * into cfg from public.review_reward_config where id = 1;
  if cfg.id is null or not cfg.active then
    raise exception 'recompensa_no_disponible';
  end if;

  select submitted_at into last_claim from public.google_reviews
   where customer_id = cust.id
   order by submitted_at desc
   limit 1;
  if last_claim is not null and last_claim > now() - (cfg.cooldown_days || ' days')::interval then
    raise exception 'ya_reclamado_recientemente';
  end if;

  new_code := 'RESENA' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
  new_expires := (now() + (cfg.valid_days || ' days')::interval)::date;

  insert into public.google_reviews (customer_id, reward_granted) values (cust.id, true);

  insert into public.customer_coupons (customer_id, code, title, discount_percent, source, expires_at)
  values (cust.id, new_code, 'Gracias por tu reseña en Google', cfg.discount_percent, 'google_review', new_expires);

  return jsonb_build_object(
    'code', new_code,
    'discountPercent', cfg.discount_percent,
    'expiresAt', new_expires
  );
end;
$$;

-- Server-side coupon validation: personal coupon first, then the global coupons table.
-- Checks ownership, redemption and expiry -- none of which the client-side lookup did.
create or replace function public.validate_coupon(p_code text, p_contact text default null)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_code text := upper(trim(p_code));
  cust public.customers;
  cc public.customer_coupons;
  gc public.coupons;
begin
  if p_contact is not null then
    select * into cust from public.customers
     where lower(email) = lower(trim(p_contact)) or phone = trim(p_contact)
     limit 1;
  end if;

  if cust.id is not null then
    select * into cc from public.customer_coupons
     where code = v_code and customer_id = cust.id and redeemed_at is null
       and (expires_at is null or expires_at >= current_date)
     limit 1;
    if cc.id is not null then
      return jsonb_build_object('kind', 'personal', 'code', cc.code, 'discountPercent', cc.discount_percent, 'title', cc.title);
    end if;
  end if;

  select * into gc from public.coupons
   where code = v_code and active
     and (valid_until is null or valid_until >= current_date)
   limit 1;
  if gc.id is not null then
    return jsonb_build_object('kind', 'global', 'code', gc.code, 'discountPercent', gc.discount_percent, 'title', gc.title, 'discountLabel', gc.discount_label);
  end if;

  return null;
end;
$$;

-- Marks a personal coupon as redeemed once its order is created. No-op for global coupons.
create or replace function public.redeem_customer_coupon(p_code text, p_order_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  update public.customer_coupons
     set redeemed_at = now(), redeemed_order_id = p_order_id
   where code = upper(trim(p_code)) and redeemed_at is null;
end;
$$;

-- Read a customer's personal coupons (loyalty accounts are contact-identified, not
-- Supabase-Auth-identified, so this mirrors get_loyalty_snapshot rather than relying on RLS).
create or replace function public.get_customer_coupons(p_contact text)
returns setof public.customer_coupons
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  cust public.customers;
begin
  select * into cust from public.customers
   where lower(email) = lower(trim(p_contact)) or phone = trim(p_contact)
   limit 1;
  if cust.id is null then
    return;
  end if;
  return query select * from public.customer_coupons where customer_id = cust.id order by created_at desc;
end;
$$;
