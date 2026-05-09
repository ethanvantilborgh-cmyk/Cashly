-- ═══════════════════════════════════════════════════════════════
--  Cashly – Supabase schema
--  Run this once in the Supabase SQL editor.
-- ═══════════════════════════════════════════════════════════════

-- ── profiles ─────────────────────────────────────────────────
create table if not exists public.profiles (
  id                uuid references auth.users(id) on delete cascade primary key,
  company_name      text    default '',
  company_address   text    default '',
  company_city      text    default '',
  company_country   text    default '',
  company_vat       text    default '',
  company_phone     text    default '',
  company_email     text    default '',
  company_iban      text    default '',
  invoice_prefix    text    default 'INV',
  payment_days      integer default 30,
  invoice_notes     text    default '',
  lang              text    default 'fr',
  plan              text    default 'free',
  seeded            boolean default false,
  created_at        timestamptz default now()
);

alter table public.profiles enable row level security;
create policy "profiles: own rows" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- ── invoices ──────────────────────────────────────────────────
create table if not exists public.invoices (
  id         text    not null,
  user_id    uuid    references auth.users(id) on delete cascade not null,
  client     text    not null default '',
  email      text    default '',
  lines      jsonb   not null default '[]',
  amount     numeric not null default 0,
  status     text    not null default 'pending',
  date       date    not null,
  due        date    not null,
  vat_rate   numeric not null default 21,
  recurring  text    not null default 'none',
  created_at timestamptz default now(),
  primary key (id, user_id)
);

alter table public.invoices enable row level security;
create policy "invoices: own rows" on public.invoices
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── expenses ──────────────────────────────────────────────────
create table if not exists public.expenses (
  id         uuid    default gen_random_uuid() primary key,
  user_id    uuid    references auth.users(id) on delete cascade not null,
  label      text    not null default '',
  amount     numeric not null default 0,
  category   text    not null default 'other',
  date       date    not null,
  note       text    default '',
  created_at timestamptz default now()
);

alter table public.expenses enable row level security;
create policy "expenses: own rows" on public.expenses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── quotes ────────────────────────────────────────────────────
create table if not exists public.quotes (
  id          text    not null,
  user_id     uuid    references auth.users(id) on delete cascade not null,
  client      text    not null default '',
  email       text    default '',
  amount      numeric not null default 0,
  status      text    not null default 'draft',
  date        date    not null,
  due         date    not null,
  vat_rate    numeric not null default 21,
  description text    default '',
  created_at  timestamptz default now(),
  primary key (id, user_id)
);

alter table public.quotes enable row level security;
create policy "quotes: own rows" on public.quotes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── services ──────────────────────────────────────────────────
create table if not exists public.services (
  id          text    not null,
  user_id     uuid    references auth.users(id) on delete cascade not null,
  name        text    not null default '',
  description text    default '',
  unit_price  numeric not null default 0,
  vat_rate    numeric not null default 21,
  unit        text    not null default 'package',
  created_at  timestamptz default now(),
  primary key (id, user_id)
);

alter table public.services enable row level security;
create policy "services: own rows" on public.services
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── clients ───────────────────────────────────────────────────
create table if not exists public.clients (
  id         text    not null,
  user_id    uuid    references auth.users(id) on delete cascade not null,
  name       text    not null default '',
  company    text    default '',
  email      text    default '',
  phone      text    default '',
  address    text    default '',
  vat        text    default '',
  created_at timestamptz default now(),
  primary key (id, user_id)
);

alter table public.clients enable row level security;
create policy "clients: own rows" on public.clients
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── trigger: auto-create profile on signup ───────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, company_name, lang, plan)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'company_name', ''),
    'fr',
    'free'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
