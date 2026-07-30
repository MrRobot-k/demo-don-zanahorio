-- orders/order_items have no public SELECT policy (only staff/admin), so the
-- checkout API route -- running with the anon key, same as the rest of the
-- client code -- needs a narrow RPC to re-read pricing-relevant fields when
-- recomputing shipping and coupon discount server-side.
create or replace function public.get_order_for_checkout(p_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  ord public.orders;
  zone public.delivery_zones;
begin
  select * into ord from public.orders where id = p_order_id;
  if ord.id is null then
    return null;
  end if;

  if ord.delivery_zone_id is not null then
    select * into zone from public.delivery_zones where id = ord.delivery_zone_id;
  end if;

  return jsonb_build_object(
    'subtotal', ord.subtotal,
    'fulfillmentType', ord.fulfillment_type,
    'distanceKm', zone.distance_km
  );
end;
$$;
