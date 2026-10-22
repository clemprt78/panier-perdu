-- Panier Perdu — relances automatiques
-- À coller dans Supabase → SQL Editor → New query → Run (une seule fois).

-- Articles du panier (affichés dans les relances) et mode test (délais en minutes).
alter table public.checkouts add column items text;
alter table public.shops add column test_mode boolean not null default false;

-- Ta boutique de test : relance 1 après 2 min, relance 2 après 5 min.
update public.shops set test_mode = true
where shopify_domain = 'panier-perdu-test-mfuleogk.myshopify.com';

-- Clients qui ont demandé à ne plus recevoir de relances, boutique par boutique.
create table public.unsubscribes (
  shop_id uuid not null references public.shops (id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now(),
  primary key (shop_id, email)
);
alter table public.unsubscribes enable row level security;
revoke all on public.unsubscribes from anon, authenticated;
grant all on public.unsubscribes to service_role;

-- Jeton qui protège l'adresse du réveil automatique. Il est généré ici,
-- ne quitte jamais la base, et n'a besoin d'être copié nulle part.
create table public.app_secrets (
  name text primary key,
  value text not null
);
alter table public.app_secrets enable row level security;
revoke all on public.app_secrets from anon, authenticated;
grant all on public.app_secrets to service_role;
insert into public.app_secrets (name, value)
values ('cron', encode(extensions.gen_random_bytes(32), 'hex'));

-- Le réveil : toutes les 5 minutes, Supabase appelle le site.
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

select cron.schedule(
  'panier-perdu-relances',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := 'https://www.panier-perdu.com/api/cron/relances',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select value from public.app_secrets where name = 'cron')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
  $$
);
