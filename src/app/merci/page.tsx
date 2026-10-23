import type { Metadata } from "next";
import Link from "next/link";
import Logo from "@/components/Logo";
import { Suspense } from "react";
import Footer from "@/components/Footer";
import { EmailCard } from "@/app/diagnostic/Funnel";
import { SETTINGS, relance1, relance2, LAUNCH_DATE_LABEL, PLANS } from "@/lib/diagnostic";
import { stripe } from "@/lib/server/stripe";
import { answersFromSession, isPaid } from "@/lib/server/delivery";

export const metadata: Metadata = { title: "Merci", robots: { index: false } };

export default function MerciPage({ searchParams }: PageProps<"/merci">) {
  return (
    <>
      <main className="flex-1 px-4 pt-5 pb-12">
        <div className="mx-auto max-w-2xl">
          <Logo href="/" />
          <Suspense fallback={<p className="mt-10 text-muted">Vérification de ton paiement…</p>}>
            <Delivery searchParams={searchParams} />
          </Suspense>
        </div>
      </main>
      <Footer />
    </>
  );
}

async function Delivery({ searchParams }: { searchParams: PageProps<"/merci">["searchParams"] }) {
  const sp = await searchParams;
  const id = typeof sp.session_id === "string" ? sp.session_id : "";

  // On demande à Stripe, côté serveur, si le paiement est vraiment passé.
  let session = null;
  if (/^cs_(test|live)_[A-Za-z0-9]+$/.test(id)) {
    try {
      session = await stripe().checkout.sessions.retrieve(id);
    } catch {}
  }

  if (!session || !isPaid(session)) {
    return (
      <section className="mt-8">
        <h1 className="font-display uppercase text-[2.3rem] leading-tight">Le paiement n&apos;a pas abouti.</h1>
        <p className="mt-3 leading-relaxed text-muted">
          Rien n&apos;a été débité. Ça arrive quand la carte est refusée ou que la page a été fermée trop tôt. Tes
          réponses sont gardées : tu peux réessayer en un instant.
        </p>
        <Link
          href="/diagnostic"
          className="mt-6 flex h-14 w-full items-center justify-center rounded-full bg-ink text-lg font-semibold text-white hover:bg-black"
        >
          Réessayer le paiement
        </Link>
      </section>
    );
  }

  const data = answersFromSession(session);
  const email = session.customer_details?.email;

  return (
    <section className="mt-8">
      <p className="inline-block rounded bg-bottle px-2 py-1 text-xs font-semibold uppercase tracking-wider text-white">
        Paiement confirmé
      </p>
      <h1 className="mt-3 font-display uppercase text-[2.5rem] leading-tight">C&apos;est fait. Ton plan est à toi.</h1>
      <p className="mt-3 leading-relaxed">
        {data ? `Formule ${PLANS[data.plan].name}. ` : ""}
        Une copie complète part {email ? <>à <b>{email}</b></> : "par email"}, avec le lien vers ton espace client.
        La voici aussi, tout de suite.
      </p>

      {data && (
        <>
          <EmailCard email={relance1(data.answers)} label="Relance 1" />
          <EmailCard email={relance2(data.answers)} label="Relance 2, avec code de réduction" />
          <div className="mt-5 rounded-lg border border-line bg-white p-4">
            <p className="font-semibold">Les 4 réglages</p>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm leading-relaxed">
              {SETTINGS.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
          </div>
        </>
      )}

      <div className="mt-6 rounded-lg bg-paper-deep p-4 leading-relaxed">
        <p className="font-semibold">Et maintenant ?</p>
        <p className="mt-1 text-sm">
          Colle les deux relances dans Shopify : Marketing → Automatisations → « Panier abandonné ». L&apos;outil
          automatique et le compteur des euros récupérés arrivent {LAUNCH_DATE_LABEL} : on t&apos;écrit pour le brancher
          avec toi.
        </p>
      </div>
    </section>
  );
}
