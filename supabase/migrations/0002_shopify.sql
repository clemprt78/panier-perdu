-- Panier Perdu — branchement Shopify
-- À coller dans Supabase → SQL Editor → New query → Run (une seule fois).

-- Les applications Shopify : une par client au début (distribution personnalisée),
-- une seule pour tout le monde plus tard (application publique).
create table public.shopify_apps (
  id uuid primary key default gen_random_uuid(),
  label text not null default '',
  client_id text not null unique,
  client_secret text not null,
  user_id uuid references auth.users (id) on delete set null, -- client à qui l'app est dédiée (vide = app publique)
  created_at timestamptz not null default now()
);
alter table public.shopify_apps enable row level security;
revoke all on public.shopify_apps from anon, authenticated;
grant all on public.shopify_apps to service_role;

-- Le jeton est lié à l'app qui l'a délivré ; prêt pour les jetons qui expirent.
alter table public.shop_secrets
  add column shopify_app_id uuid references public.shopify_apps (id) on delete set null,
  add column refresh_token text,
  add column access_token_expires_at timestamptz;

-- Abonnements créés à la main (vente directe) : pas d'identifiant Stripe.
alter table public.subscriptions add column source text not null default 'stripe'
  check (source in ('stripe', 'manuel'));

alter table public.shops add column last_synced_at timestamptz;
