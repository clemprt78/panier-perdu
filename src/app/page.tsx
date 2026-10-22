import Link from "next/link";
import Footer from "@/components/Footer";
import { SITE } from "@/lib/site";

const BENEFITS = [
  {
    title: "Deux relances qui donnent envie de revenir",
    text: "Écrites pour ta boutique, envoyées 1 heure puis 24 heures après l'abandon. Pas de « Cher client », pas de ton robot.",
  },
  {
    title: "Une réduction, seulement si elle sert",
    text: "Le code part uniquement avec la seconde relance. Ceux qui reviennent d'eux-mêmes paient plein tarif.",
  },
  {
    title: "Ce que ça rapporte, en euros",
    text: "Un compteur du chiffre d'affaires récupéré. Pas de taux d'ouverture à interpréter.",
  },
];

export default function Home() {
  return (
    <>
      <main className="flex-1 px-4 pt-6 pb-12">
        <div className="mx-auto max-w-2xl">
          <p className="font-display text-lg font-semibold text-bottle">{SITE.name}</p>

          <section className="mt-8">
            <p className="text-sm font-medium uppercase tracking-wider text-muted">
              Pour les boutiques Shopify de 10 à 150 commandes par mois
            </p>
            <h1 className="mt-3 font-display text-[2.35rem] leading-[1.08] font-extrabold text-ink sm:text-5xl">
              {SITE.promise}
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-muted">
              Sur 10 paniers remplis, 7 ne sont jamais payés. La plupart des petites boutiques ne relancent
              personne. Panier Perdu le fait pour toi, pour 39&nbsp;€ par mois.
            </p>
          </section>

          {/* La douleur, chiffrée : ticket de caisse d'une boutique type */}
          <section aria-label="Exemple chiffré" className="mt-8">
            <div className="ticket px-5 shadow-[0_1px_0_rgba(0,0,0,0.04)]">
              <p className="text-xs uppercase tracking-widest text-muted">Boutique type · un mois</p>
              <dl className="mt-3 space-y-2 num">
                <Row k="Commandes payées" v="35" />
                <Row k="Paniers abandonnés" v="82" />
                <Row k="Clients relancés" v="0" />
              </dl>
              <div className="dashed my-3" />
              <div className="flex items-baseline justify-between">
                <span className="font-medium">Laissé sur la table</span>
                <span className="font-display text-3xl font-extrabold text-brick num">3 690 €</span>
              </div>
              <p className="mt-2 text-xs text-muted">35 commandes, panier moyen de 45 €.</p>
            </div>
          </section>

          <section className="mt-10 space-y-6">
            {BENEFITS.map((b, i) => (
              <div key={b.title} className="flex gap-4">
                <span className="font-display text-2xl font-extrabold text-bottle num w-6 shrink-0">{i + 1}</span>
                <div>
                  <h2 className="font-semibold text-lg leading-snug">{b.title}</h2>
                  <p className="mt-1 text-muted leading-relaxed">{b.text}</p>
                </div>
              </div>
            ))}
          </section>

          <div className="mt-10 hidden sm:block">
            <Cta />
          </div>
        </div>
      </main>

      {/* Bouton collé en bas sur mobile : atteignable au pouce */}
      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-paper/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-sm sm:hidden">
        <Cta />
      </div>

      <Footer />
      {/* Espace réservé sous le pied de page : le bouton collé en bas ne cache plus rien */}
      <div className="h-32 sm:hidden" aria-hidden="true" />
    </>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted">{k}</dt>
      <dd className="font-medium">{v}</dd>
    </div>
  );
}

function Cta() {
  return (
    <div>
      <Link
        href="/diagnostic"
        className="flex h-14 w-full items-center justify-center rounded-lg bg-brick text-lg font-semibold text-white active:bg-brick-dark hover:bg-brick-dark sm:w-auto sm:px-10 sm:inline-flex"
      >
        Commencer, c&apos;est gratuit
      </Link>
      <p className="mt-2 text-center text-sm text-muted sm:text-left">3 questions · 1 minute · sans inscription</p>
    </div>
  );
}
