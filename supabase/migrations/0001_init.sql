-- Panier Perdu — schéma initial
-- À coller tel quel dans Supabase → SQL Editor → New query → Run.

-- 1. Abonnements (écrits uniquement par le serveur, via le webhook Stripe)
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  plan text not null check (plan in ('mensuel', 'fondateur', 'annuel')),
  status text not null default 'active',
  stripe_customer_id text,
  stripe_subscription_id text unique,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index subscriptions_user_idx on public.subscriptions (user_id);

-- 2. Boutiques
create table public.shops (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null default '',
  shopify_domain text unique, -- ex. ma-boutique.myshopify.com, vide tant que non branchée
  relance1_subject text not null,
  relance1_body text not null,
  relance1_delay_minutes int not null default 60 check (relance1_delay_minutes between 15 and 1440),
  relance2_subject text not null,
  relance2_body text not null,
  relance2_delay_hours int not null default 24 check (relance2_delay_hours between 2 and 168),
  discount_enabled boolean not null default true,
  discount_percent int not null default 10 check (discount_percent between 1 and 50),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index shops_user_idx on public.shops (user_id);

-- 3. Jeton Shopify : lisible uniquement par le serveur (aucune règle d'accès client)
create table public.shop_secrets (
  shop_id uuid primary key references public.shops (id) on delete cascade,
  shopify_access_token text not null,
  updated_at timestamptz not null default now()
);

-- 4. Paniers abandonnés et leur suivi
create table public.checkouts (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops (id) on delete cascade,
  shopify_checkout_id text not null,
  email text not null,
  first_name text,
  total_cents int not null default 0,
  currency text not null default 'EUR',
  recovery_url text,
  abandoned_at timestamptz not null,
  status text not null default 'pending'
    check (status in ('pending', 'relance1_sent', 'relance2_sent', 'recovered', 'stopped')),
  relance1_sent_at timestamptz,
  relance2_sent_at timestamptz,
  discount_code text,
  recovered_order_id text,
  recovered_cents int,
  recovered_at timestamptz,
  created_at timestamptz not null default now(),
  unique (shop_id, shopify_checkout_id)
);
create index checkouts_shop_status_idx on public.checkouts (shop_id, status);
create index checkouts_recovered_idx on public.checkouts (shop_id, recovered_at) where recovered_at is not null;

-- Règles d'accès : chaque client ne voit que ses propres lignes.
-- Toutes les écritures passent par le serveur (clé secrète), qui contourne ces règles.
alter table public.subscriptions enable row level security;
alter table public.shops enable row level security;
alter table public.shop_secrets enable row level security;
alter table public.checkouts enable row level security;

create policy "lire mes abonnements" on public.subscriptions
  for select to authenticated using (user_id = (select auth.uid()));

create policy "lire mes boutiques" on public.shops
  for select to authenticated using (user_id = (select auth.uid()));

create policy "lire les paniers de mes boutiques" on public.checkouts
  for select to authenticated using (
    exists (select 1 from public.shops s where s.id = shop_id and s.user_id = (select auth.uid()))
  );
-- shop_secrets : aucune règle = aucun accès depuis le navigateur.

-- Droits explicites (les règles ci-dessus filtrent ensuite ligne par ligne)
revoke all on public.subscriptions, public.shops, public.shop_secrets, public.checkouts from anon, authenticated;
grant select on public.subscriptions, public.shops, public.checkouts to authenticated;
grant all on public.subscriptions, public.shops, public.shop_secrets, public.checkouts to service_role;

-- Utilisé par la page de connexion (serveur uniquement) : ce compte existe-t-il ?
create function public.user_exists(p_email text) returns boolean
language sql security definer set search_path = '' as $$
  select exists (select 1 from auth.users where lower(email) = lower(p_email));
$$;
revoke execute on function public.user_exists(text) from public, anon, authenticated;
grant execute on function public.user_exists(text) to service_role;
