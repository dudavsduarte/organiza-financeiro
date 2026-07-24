-- ORGANIZA: banco completo para Supabase
-- Execute este arquivo no SQL Editor de um projeto novo.

create extension if not exists "pgcrypto";

create table if not exists public.access_grants (
  email text primary key,
  access_status text not null default 'pending' check (access_status in ('active','pending','blocked')),
  plan text not null default 'premium',
  product_id text,
  transaction_id text,
  purchase_status text,
  access_until timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  email text unique not null,
  access_status text not null default 'pending' check (access_status in ('active','pending','blocked')),
  plan text not null default 'free',
  access_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  description text not null,
  amount numeric(12,2) not null check (amount > 0),
  type text not null check (type in ('income','expense')),
  category text not null,
  date date not null,
  account text not null default 'Conta principal',
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null,
  "limit" numeric(12,2) not null check ("limit" > 0),
  month text not null,
  created_at timestamptz not null default now(),
  unique(user_id, category, month)
);

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  target numeric(12,2) not null check (target > 0),
  current numeric(12,2) not null default 0 check (current >= 0),
  deadline date not null,
  icon text,
  created_at timestamptz not null default now()
);

create table if not exists public.recurring_bills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  description text not null,
  amount numeric(12,2) not null check (amount > 0),
  category text not null,
  due_day integer not null check (due_day between 1 and 31),
  type text not null check (type in ('income','expense')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.hotmart_events (
  id uuid primary key default gen_random_uuid(),
  event_id text unique,
  event_type text not null,
  buyer_email text,
  transaction_id text,
  payload jsonb not null,
  received_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare grant_row public.access_grants%rowtype;
begin
  select * into grant_row from public.access_grants where lower(email) = lower(new.email) limit 1;
  insert into public.profiles (id, name, email, access_status, plan, access_until)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    lower(new.email),
    coalesce(grant_row.access_status, 'pending'),
    coalesce(grant_row.plan, 'free'),
    grant_row.access_until
  )
  on conflict (id) do update set
    name = excluded.name,
    email = excluded.email,
    access_status = excluded.access_status,
    plan = excluded.plan,
    access_until = excluded.access_until,
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.transactions enable row level security;
alter table public.budgets enable row level security;
alter table public.goals enable row level security;
alter table public.recurring_bills enable row level security;
alter table public.access_grants enable row level security;
alter table public.hotmart_events enable row level security;

create policy "read own profile" on public.profiles for select using (auth.uid() = id);

create policy "own transactions" on public.transactions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own budgets" on public.budgets for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own goals" on public.goals for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own recurring" on public.recurring_bills for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- access_grants e hotmart_events ficam inacessíveis ao navegador.
-- Somente a Edge Function com service role pode escrever ou ler essas tabelas.

create index if not exists transactions_user_date_idx on public.transactions(user_id, date desc);
create index if not exists budgets_user_month_idx on public.budgets(user_id, month);
create index if not exists goals_user_idx on public.goals(user_id);
create index if not exists recurring_user_idx on public.recurring_bills(user_id);
