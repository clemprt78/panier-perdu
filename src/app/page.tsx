import Link from "next/link";
import Footer from "@/components/Footer";
import Scrolly, { CtaButton } from "./Scrolly";

export default function Home() {
  return (
    <>
      {/* Barre du haut, posée sur la scène */}
      <header className="fixed inset-x-0 top-0 z-20">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="font-poster text-xl uppercase tracking-wide text-ink">
            Panier Perdu
          </Link>
          <Link
            href="/diagnostic"
            className="hidden rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white hover:bg-black sm:inline-block"
          >
            Commencer, c&apos;est gratuit
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <Scrolly />

        {/* En clair, sans animation : à quoi ça sert, en 3 étapes */}
        <section className="bg-paper px-4 py-16 sm:py-24" aria-labelledby="comment">
          <div className="mx-auto max-w-6xl">
            <p className="text-[0.8rem] font-semibold uppercase tracking-[0.18em] text-brick-dark">En clair</p>
            <h2 id="comment" className="mt-3 font-poster text-[clamp(2.2rem,8vw,4.5rem)] uppercase leading-[0.95] text-ink">
              Comment ça marche
            </h2>
            <ol className="mt-10 grid gap-4 sm:grid-cols-3 sm:gap-6">
              {[
                {
                  n: "1",
                  t: "On branche ta boutique Shopify",
                  d: "10 minutes, ensemble, une seule fois. Tes relances sont déjà écrites à ton nom.",
                },
                {
                  n: "2",
                  t: "Les relances partent toutes seules",
                  d: "Un client part sans payer ? Il reçoit un email 1 heure après, puis un second avec −10 % le lendemain.",
                },
                {
                  n: "3",
                  t: "Tu vois les ventes récupérées",
                  d: "Ton espace affiche, en euros, ce que les relances t’ont rapporté ce mois-ci.",
                },
              ].map((x) => (
                <li key={x.n} className="rounded-2xl border border-line bg-white p-6">
                  <span className="font-poster text-5xl leading-none text-brick">{x.n}</span>
                  <h3 className="mt-4 text-lg font-semibold leading-snug">{x.t}</h3>
                  <p className="mt-2 leading-relaxed text-muted">{x.d}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Fin du récit : l'appel à l'action */}
        <section className="bg-ink px-4 py-20 text-paper">
          <div className="mx-auto max-w-6xl">
            <p className="text-[0.8rem] font-semibold uppercase tracking-[0.18em] text-[#ffb98f]">Ton diagnostic</p>
            <h2 className="mt-3 font-poster text-[clamp(2.6rem,11vw,6.5rem)] uppercase leading-[0.92]">
              Combien tes paniers te coûtent&nbsp;?
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-paper/80">
              Trois questions, une minute, sans inscription. Tu vois ton chiffre, tes relances déjà écrites, et tu décides
              ensuite.
            </p>
            <div className="mt-8 hidden sm:block">
              <CtaButton className="w-fit bg-[#ff6b1a] text-ink hover:bg-[#ff7d36]" />
            </div>
            <ul className="mt-10 grid gap-3 text-sm text-paper/70 sm:grid-cols-3">
              <li>Sans engagement, résiliable à tout moment</li>
              <li>Satisfait ou remboursé 30 jours</li>
              <li>Branché avec toi en 10 minutes</li>
            </ul>
          </div>
        </section>
      </main>

      {/* Bouton collé en bas sur mobile : atteignable au pouce */}
      <div className="fixed inset-x-0 bottom-0 z-20 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:hidden">
        <CtaButton className="w-full shadow-[0_10px_30px_-8px_rgba(0,0,0,0.45)]" />
        <p className="mt-1.5 text-center text-xs font-medium text-ink/70 mix-blend-multiply">
          3 questions · 1 minute · sans inscription
        </p>
      </div>

      <Footer />
      <div className="h-28 sm:hidden" aria-hidden="true" />
    </>
  );
}
