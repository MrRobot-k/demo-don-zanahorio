-- Bridge between the public voting table (cashiers) and the RLS-gated employees table
alter table public.cashiers add column employee_id uuid references public.employees(id);

create policy "admins manage cashiers" on public.cashiers
  for all using (public.is_admin_employee()) with check (public.is_admin_employee());

-- Singleton config for the survey-driven incentive program
create table public.employee_bonus_config (
  id int primary key default 1 check (id = 1),
  min_service_rating smallint not null default 5,
  amount_per_survey numeric not null default 15,
  top_vote_amount numeric not null default 200,
  active boolean not null default true
);
insert into public.employee_bonus_config (id) values (1);

alter table public.employee_bonus_config enable row level security;
create policy "staff read bonus config" on public.employee_bonus_config
  for select using (public.is_active_employee());
create policy "admins manage bonus config" on public.employee_bonus_config
  for all using (public.is_admin_employee()) with check (public.is_admin_employee());

-- Continuous ledger, mirroring wallet_transactions on the customer side
create table public.employee_bonus_transactions (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id),
  amount numeric not null,
  type text not null check (type in ('survey_incentive','payout','adjustment')),
  reference_survey_id uuid references public.surveys(id),
  note text,
  created_at timestamptz not null default now()
);
create index employee_bonus_transactions_employee_id_idx on public.employee_bonus_transactions (employee_id, created_at);
-- A survey can only ever generate one incentive entry
create unique index employee_bonus_transactions_survey_uidx on public.employee_bonus_transactions (reference_survey_id) where reference_survey_id is not null;

alter table public.employee_bonus_transactions enable row level security;
create policy "employees read own bonus ledger" on public.employee_bonus_transactions
  for select using (exists (
    select 1 from public.employees e
    where e.id = employee_bonus_transactions.employee_id and e.auth_user_id = auth.uid()
  ));
create policy "admins read all bonus ledger" on public.employee_bonus_transactions
  for select using (public.is_admin_employee());

-- Replaces submitSurvey: inserts the survey and, in the same transaction, credits the
-- cashier's linked employee when the service rating clears the configured threshold.
create or replace function public.submit_survey_with_incentive(
  p_branch_rating smallint,
  p_service_rating smallint,
  p_cashier_id uuid,
  p_comments text,
  p_contact text default null
)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  cust public.customers;
  cashier public.cashiers;
  cfg public.employee_bonus_config;
  new_survey_id uuid;
begin
  if p_contact is not null then
    select * into cust from public.customers
     where lower(email) = lower(trim(p_contact)) or phone = trim(p_contact)
     limit 1;
  end if;

  insert into public.surveys (customer_id, branch_rating, service_rating, cashier_id, comments)
  values (cust.id, p_branch_rating, p_service_rating, p_cashier_id, p_comments)
  returning id into new_survey_id;

  if p_cashier_id is not null then
    select * into cashier from public.cashiers where id = p_cashier_id;
    select * into cfg from public.employee_bonus_config where id = 1;

    if cashier.employee_id is not null and cfg.active and p_service_rating >= cfg.min_service_rating then
      insert into public.employee_bonus_transactions (employee_id, amount, type, reference_survey_id, note)
      values (
        cashier.employee_id,
        cfg.amount_per_survey,
        'survey_incentive',
        new_survey_id,
        'Encuesta con calificación de servicio ' || p_service_rating
      );
    end if;
  end if;

  return new_survey_id;
end;
$$;

-- Admin-gated payout entry
create or replace function public.pay_employee_bonus(p_employee_id uuid, p_amount numeric, p_note text default null)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if not public.is_admin_employee() then
    raise exception 'forbidden' using errcode = '28000';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'monto_invalido';
  end if;
  insert into public.employee_bonus_transactions (employee_id, amount, type, note)
  values (p_employee_id, -p_amount, 'payout', p_note);
end;
$$;
