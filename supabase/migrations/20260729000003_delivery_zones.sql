create table public.delivery_zones (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  distance_km numeric not null check (distance_km >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.delivery_zones enable row level security;
create policy "public read active delivery zones" on public.delivery_zones
  for select using (active = true);
create policy "admins manage delivery zones" on public.delivery_zones
  for all using (public.is_admin_employee()) with check (public.is_admin_employee());

insert into public.delivery_zones (name, distance_km) values
  ('Centro', 2),
  ('Las Palmas', 3),
  ('Miguel Hidalgo', 4),
  ('Del Maestro', 5),
  ('Praderas', 6),
  ('Libramiento Naciones Unidas', 8),
  ('Guadalupe', 9),
  ('Los Altos', 10);

alter table public.orders add column delivery_zone_id uuid references public.delivery_zones(id);
alter table public.orders add column distance_km numeric;

alter table public.wholesale_orders add column delivery_zone_id uuid references public.delivery_zones(id);
alter table public.wholesale_orders add column shipping_cost numeric not null default 0;
