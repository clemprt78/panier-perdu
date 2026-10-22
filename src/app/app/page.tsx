import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { EmailCard } from "@/app/diagnostic/Funnel";
import { LAUNCH_DATE_LABEL, PLANS, euros, type PlanId } from "@/lib/diagnostic";
import { supabaseUser } from "@/lib/server/supabase";
import { signOut } from "./actions";

export const metadata: Metadata = { title: "Mon espace", robots: { index: false } };

export default function AppPage() {
  return (
    <main className="flex-1 px-4 pt-5 pb-12">
      <div className="mx-auto max-w-2xl">
        <header className="flex items-center justify-between">
          <Link href="/app" className="font-display text-lg font-semibold text-bottle py-2">
            Panier Perdu
          </Link>
          <form action={signOut}>
            <button className="py-2 pl-4 text-sm text-muted underline underline-offset-4">Se déconnecter</button>
          </form>
        </header>
        <Suspense fallback={<p className="mt-10 text-muted">Chargement de ton espace…</p>}>
          <Dashboard />
        </Suspense>
      </div>
    </main>
  );
}

async function Dashboard() {
  const supabase = await supabaseUser();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const [{ data: subs }, { data: shops }] = await Promise.all([
    supabase.from("subscriptions").select("plan,status").order("created_at", { ascending: false }).limit(1),
    supabase.from("shops").select("*").order("created_at").limit(1),
  ]);
  const sub = subs?.[0];
  const shop = shops?.[0];

  // Compteur du mois en cours (0 tant que la boutique n'est pas branchée)
  let recovered = 0;
  if (shop) {
    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    const { data: rows } = await supabase
      .from("checkouts")
      .select("recovered_cents")
      .eq("shop_id", shop.id)
      .gte("recovered_at", start.toISOString());
    recovered = (rows ?? []).reduce((s, r) => s + (r.recovered_cents ?? 0), 0) / 100;
  }

  const active = sub && ["active", "trialing"].includes(sub.status);

  return (
    <>
      <section className="mt-6">
        <p className="text-sm text-muted">{user.email}</p>
        <h1 className="mt-1 font-display text-[1.9rem] font-extrabold leading-tight">
          {shop?.name ? `Bonjour, ${shop.name}` : "Bonjour"}
        </h1>
        {sub ? (
          <p className="mt-2 text-sm">
            Formule <b>{PLANS[sub.plan as PlanId]?.name ?? sub.plan}</b> ·{" "}
            <span className={active ? "text-bottle font-medium" : "text-brick-dark font-medium"}>
              {active ? "active" : "inactive"}
            </span>
          </p>
        ) : (
          <p className="mt-2 rounded-lg bg-paper-deep p-3 text-sm">
            Aucun abonnement trouvé pour cette adresse. Écris-nous si tu penses que c&apos;est une erreur.
          </p>
        )}
      </section>

      {/* Le compteur, même vide, montre ce qui arrive */}
      <section className="ticket mt-6 px-5" aria-label="Chiffre d'affaires récupéré">
        <p className="text-xs uppercase tracking-widest text-muted">Récupéré ce mois-ci</p>
        <p className="mt-1 font-display text-5xl font-extrabold text-bottle num">{euros(recovered)}</p>
        <p className="mt-2 text-sm text-muted">
          {shop?.shopify_domain
            ? "Commandes passées dans les 7 jours suivant une relance."
            : "Le compteur démarre dès que ta boutique est branchée."}
        </p>
      </section>

      {/* État vide guidé : les 3 étapes */}
      <section className="mt-8">
        <h2 className="font-semibold text-lg">Ta mise en route</h2>
        <ol className="mt-3 space-y-3">
          <StepItem done title="Ton plan de relance est prêt">
            Tes deux relances sont ci-dessous. Tu peux déjà les coller dans Shopify.
          </StepItem>
          <StepItem done={Boolean(shop?.shopify_domain)} title="Brancher ta boutique Shopify">
            {shop?.shopify_domain
              ? shop.shopify_domain
              : `Mise en service ${LAUNCH_DATE_LABEL} : on t'écrit pour la brancher avec toi, en 10 minutes.`}
          </StepItem>
          <StepItem done={false} title="Les relances partent toutes seules">
            Relance 1 une heure après l&apos;abandon, relance 2 le lendemain avec ton code de réduction.
          </StepItem>
        </ol>
      </section>

      {shop && (
        <section className="mt-8">
          <h2 className="font-semibold text-lg">Tes relances</h2>
          <EmailCard
            label="Relance 1"
            email={{
              when: `${shop.relance1_delay_minutes} min après l'abandon`,
              subject: shop.relance1_subject,
              body: shop.relance1_body,
            }}
          />
          <EmailCard
            label="Relance 2"
            email={{
              when: `${shop.relance2_delay_hours} h après l'abandon${shop.discount_enabled ? ` · code -${shop.discount_percent} %` : ""}`,
              subject: shop.relance2_subject,
              body: shop.relance2_body,
            }}
          />
        </section>
      )}
    </>
  );
}

function StepItem({ done, title, children }: { done: boolean; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3 rounded-lg border border-line bg-white p-4">
      <span
        className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm ${
          done ? "bg-bottle text-white" : "border-2 border-line text-transparent"
        }`}
        aria-hidden="true"
      >
        ✓
      </span>
      <div>
        <p className="font-semibold">
          {title}
          <span className="sr-only">{done ? " (fait)" : " (à venir)"}</span>
        </p>
        <p className="mt-0.5 text-sm text-muted leading-relaxed">{children}</p>
      </div>
    </li>
  );
}
