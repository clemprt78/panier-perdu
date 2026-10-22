"use client";

import { useCallback, useState } from "react";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import {
  GUARANTEE,
  LAUNCH_DATE_LABEL,
  PLANS,
  PLAN_ORDER,
  compute,
  euros,
  euros2,
  perDay,
  shopName,
  type Answers,
  type PlanId,
} from "@/lib/diagnostic";
import { SITE } from "@/lib/site";

const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
let stripePromise: Promise<Stripe | null> | null = null;
const getStripe = () => (stripePromise ??= pk ? loadStripe(pk) : Promise.resolve(null));

export default function Paywall({ a }: { a: Answers }) {
  const r = compute(a);
  const [plan, setPlan] = useState<PlanId>("fondateur");
  const monthly = PLANS[plan].interval === "year" ? PLANS[plan].cents / 100 / 12 : PLANS[plan].cents / 100;

  return (
    <section className="mt-6">
      {/* 1. Ce qui a été fait pour la personne */}
      <p className="inline-block rounded bg-bottle px-2 py-1 text-xs font-semibold uppercase tracking-wider text-white">
        Satisfait ou remboursé {GUARANTEE.days} jours
      </p>
      <h1 className="mt-3 font-display text-[1.9rem] leading-tight font-extrabold">Voilà ton plan, prêt.</h1>
      <ul className="mt-4 space-y-2">
        <Check>Relance 1, écrite pour {shopName(a)}</Check>
        <Check>Relance 2 avec code de réduction de 10 %</Check>
        <Check>Les 4 réglages pour {r.orders} commandes par mois</Check>
      </ul>
      <p className="mt-3 text-muted">Abonne-toi pour le garder et le faire tourner tout seul.</p>

      {/* 2. Ce que ça rapporte, comparé au prix */}
      <div className="mt-6 grid grid-cols-2 gap-3 num">
        <div className="rounded-lg bg-bottle p-4 text-white">
          <p className="text-sm text-white/80">Récupéré en plus, estimation</p>
          <p className="mt-1 font-display text-3xl font-extrabold">+{euros(r.gain)}</p>
          <p className="text-sm text-white/80">par mois</p>
        </div>
        <div className="rounded-lg border-2 border-line bg-white p-4">
          <p className="text-sm text-muted">Panier Perdu</p>
          <p className="mt-1 font-display text-3xl font-extrabold">{euros(monthly)}</p>
          <p className="text-sm text-muted">par mois</p>
        </div>
      </div>

      {/* 3. Les formules, celle du milieu mise en avant */}
      <fieldset className="mt-8">
        <legend className="font-semibold text-lg">Choisis ta formule</legend>
        <div className="mt-3 flex flex-col gap-3">
          {PLAN_ORDER.map((id) => {
            const p = PLANS[id];
            const active = plan === id;
            const featured = id === "fondateur";
            return (
              <label
                key={id}
                className={`relative flex cursor-pointer items-center gap-3 rounded-lg border-2 bg-white px-4 py-4 ${
                  active ? "border-brick" : "border-line"
                } ${featured ? "shadow-[0_0_0_4px_rgba(217,84,30,0.12)]" : ""}`}
              >
                {featured && (
                  <span className="absolute -top-3 left-4 rounded bg-brick px-2 py-0.5 text-xs font-semibold text-white">
                    Recommandé
                  </span>
                )}
                <input
                  type="radio"
                  name="plan"
                  value={id}
                  checked={active}
                  onChange={() => setPlan(id)}
                  className="h-5 w-5 accent-[#d9541e]"
                />
                <span className="flex-1">
                  <span className="block font-semibold">{p.name}</span>
                  <span className="block text-sm text-muted">{p.note}</span>
                </span>
                <span className="text-right num">
                  <span className="block font-semibold">
                    {euros(p.cents / 100)}
                    <span className="text-sm font-normal text-muted">/{p.interval === "year" ? "an" : "mois"}</span>
                  </span>
                  <span className="block text-sm text-muted">{euros2(perDay(id))}/jour</span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {/* 4. La garantie, en clair */}
      <div className="mt-6 rounded-lg border-2 border-bottle bg-white p-4">
        <p className="font-semibold text-bottle">Garantie satisfait ou remboursé : {GUARANTEE.days} jours</p>
        <p className="mt-1 text-sm leading-relaxed">
          Si Panier Perdu ne te convient pas dans les {GUARANTEE.days} jours qui suivent ton paiement, envoie{" "}
          {GUARANTEE.how} ({SITE.contact}). Tu es remboursé en totalité sous {GUARANTEE.refundDays} jours, sur ta carte.
        </p>
      </div>

      {/* 5 + 6. Sans engagement + paiement sur le même écran */}
      <div className="mt-8" id="paiement">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-semibold text-lg">Paiement sécurisé</h2>
          <p className="text-sm font-medium text-bottle">Sans engagement, résiliable à tout moment</p>
        </div>
        <Checkout key={plan} plan={plan} a={a} />
      </div>

      {/* 7. Les quatre objections */}
      <section className="mt-10">
        <h2 className="font-display text-2xl font-extrabold">Questions fréquentes</h2>
        <Faq q="Est-ce que ça marche pour ma boutique ?">
          Panier Perdu est fait pour les boutiques Shopify de 10 à 150 commandes par mois. Il relance les clients qui ont
          laissé leur email au moment du paiement. Si ta boutique n&apos;est pas sur Shopify, écris-nous avant de payer.
        </Faq>
        <Faq q="Combien de temps ça me prend ?">
          Une dizaine de minutes, une seule fois : tu reçois ton plan par email juste après le paiement, et on branche ta
          boutique avec toi. Ensuite, tout part seul.
        </Faq>
        <Faq q="Et si je veux arrêter ?">
          Tu résilies quand tu veux, d&apos;un simple email, sans frais. Tu n&apos;es plus prélevé au mois suivant. Pendant
          les {GUARANTEE.days} premiers jours, tu es en plus remboursé en totalité.
        </Faq>
        <Faq q="À quoi sert exactement ce que je paie ?">
          Tout de suite : ton plan complet (les deux relances écrites pour ta boutique, le code de réduction et les
          réglages), à coller dans Shopify. Ton abonnement te donne aussi l&apos;outil automatique (branchement à
          ta boutique, envoi des relances, compteur des euros récupérés), mis en service {LAUNCH_DATE_LABEL}. S&apos;il
          ne l&apos;est pas, tu es remboursé en totalité.
        </Faq>
      </section>
    </section>
  );
}

function Check({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-bottle text-sm text-white">
        ✓
      </span>
      <span className="font-medium">{children}</span>
    </li>
  );
}

function Faq({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <details className="border-b border-line py-1">
      <summary className="cursor-pointer py-3 font-semibold">{q}</summary>
      <p className="pb-4 leading-relaxed text-muted">{children}</p>
    </details>
  );
}

function Checkout({ plan, a }: { plan: PlanId; a: Answers }) {
  const [error, setError] = useState<string | null>(null);

  const fetchClientSecret = useCallback(async () => {
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan, answers: a }),
    });
    const data = (await res.json().catch(() => ({}))) as { clientSecret?: string; error?: string };
    if (!res.ok || !data.clientSecret) {
      const msg = data.error || "Le paiement n'a pas pu s'ouvrir.";
      setError(msg);
      throw new Error(msg);
    }
    return data.clientSecret;
    // On ne recrée la session que si la formule change (clé du composant).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan]);

  if (!pk) {
    return (
      <p className="mt-4 rounded-lg bg-paper-deep p-4 text-sm">
        Le paiement n&apos;est pas encore branché sur ce site. Reviens dans quelques minutes.
      </p>
    );
  }

  if (error) {
    return (
      <div className="mt-4 rounded-lg border-2 border-brick bg-white p-4" role="alert">
        <p className="font-semibold">Le paiement n&apos;a pas pu s&apos;ouvrir.</p>
        <p className="mt-1 text-sm text-muted">Rien n&apos;a été débité. Recharge la page pour réessayer.</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-3 h-12 w-full rounded-lg bg-brick font-semibold text-white"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="mt-4 overflow-hidden rounded-lg bg-white">
      <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret }}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}
