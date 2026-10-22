import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { requireOwner } from "@/lib/server/owner";
import { supabaseAdmin } from "@/lib/server/supabase";
import { SITE } from "@/lib/site";
import { ManualCustomerForm, ShopifyAppForm } from "./forms";
import CopyField from "./CopyField";

export const metadata: Metadata = { title: "Administration", robots: { index: false } };

export default function AdminPage() {
  return (
    <main className="flex-1 px-4 pt-5 pb-12">
      <div className="mx-auto max-w-2xl">
        <header className="flex items-center justify-between">
          <Link href="/app" className="font-display text-lg font-semibold text-bottle py-2">
            Panier Perdu
          </Link>
          <a href="/app" className="py-2 pl-4 text-sm text-muted underline underline-offset-4">
            Mon espace
          </a>
        </header>
        <Suspense fallback={<p className="mt-10 text-muted">Chargement…</p>}>
          <Admin />
        </Suspense>
      </div>
    </main>
  );
}

async function Admin() {
  if (!(await requireOwner())) notFound();
  const db = supabaseAdmin();
  const [{ data: apps }, { data: subs }, { data: shops }] = await Promise.all([
    db.from("shopify_apps").select("id,label,user_id,created_at").order("created_at", { ascending: false }),
    db.from("subscriptions").select("user_id,plan,status,source,created_at").order("created_at", { ascending: false }).limit(50),
    db.from("shops").select("user_id,name,shopify_domain,last_synced_at"),
  ]);
  const shopOf = (uid: string | null) => shops?.find((s) => s.user_id === uid);

  return (
    <>
      <h1 className="mt-6 font-display text-[1.9rem] font-extrabold leading-tight">Administration</h1>
      <p className="mt-1 text-sm text-muted">Visible uniquement par toi.</p>

      <section className="mt-8 rounded-lg border border-line bg-white p-4">
        <h2 className="font-semibold text-lg">1. Créer un client à la main</h2>
        <p className="mt-1 text-sm text-muted">Pour une vente conclue hors du site (virement, rendez-vous).</p>
        <ManualCustomerForm />
      </section>

      <section className="mt-6 rounded-lg border border-line bg-white p-4">
        <h2 className="font-semibold text-lg">2. Brancher la boutique d&apos;un client</h2>
        <p className="mt-1 text-sm text-muted">
          Crée d&apos;abord son application dans le Dev Dashboard Shopify, puis colle ici son Client ID et son Secret.
        </p>
        <ShopifyAppForm />
      </section>

      <section className="mt-8">
        <h2 className="font-semibold text-lg">Applications Shopify</h2>
        {!apps?.length && <p className="mt-2 text-sm text-muted">Aucune pour l&apos;instant.</p>}
        <ul className="mt-3 space-y-3">
          {apps?.map((a) => {
            const shop = shopOf(a.user_id);
            return (
              <li key={a.id} className="rounded-lg border border-line bg-white p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-semibold">{a.label}</p>
                  <p className={`text-sm font-medium ${shop?.shopify_domain ? "text-bottle" : "text-muted"}`}>
                    {shop?.shopify_domain ? `Branchée : ${shop.shopify_domain}` : "Pas encore branchée"}
                  </p>
                </div>
                <CopyField label="App URL" value={`${SITE.url}/api/shopify/install/${a.id}`} />
                <CopyField label="Allowed redirection URL" value={`${SITE.url}/api/shopify/callback/${a.id}`} />
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="font-semibold text-lg">Abonnements récents</h2>
        <ul className="mt-3 divide-y divide-line rounded-lg border border-line bg-white">
          {subs?.map((s, i) => (
            <li key={i} className="flex flex-wrap justify-between gap-2 px-4 py-3 text-sm">
              <span>{shopOf(s.user_id)?.name || "(sans nom)"}</span>
              <span className="text-muted">
                {s.plan} · {s.status} · {s.source}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
