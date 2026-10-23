import Footer from "@/components/Footer";
import Scrolly, { CtaButton } from "./Scrolly";
import HomeHeader from "./HomeHeader";
import { GUARANTEE, PLANS, PLAN_ORDER, euros, euros2, perDay } from "@/lib/diagnostic";
import { SITE } from "@/lib/site";

const FAQ = [
  {
    q: "Est-ce que ça marche pour ma boutique ?",
    a: "Panier Perdu fonctionne avec toutes les boutiques Shopify. Il relance les clients qui ont laissé leur email au moment du paiement. Pas sur Shopify ? Écris-nous avant de payer.",
  },
  {
    q: "Combien de temps ça me prend ?",
    a: "Dix minutes, une seule fois : on branche ta boutique avec toi. Tes relances sont déjà écrites à ton nom. Ensuite, tout part seul.",
  },
  {
    q: "Mes clients vont-ils recevoir des emails « robot » ?",
    a: "Non. Les emails partent au nom de ta boutique, avec le prénom du client et ce qu’il avait dans son panier. S’il répond, sa réponse arrive chez toi. Chaque email contient un lien pour ne plus en recevoir.",
  },
  {
    q: "Qu’est-ce que Panier Perdu peut faire dans ma boutique ?",
    a: "Trois choses seulement : lire les paniers abandonnés, lire les commandes (pour arrêter les relances et compter les ventes récupérées) et créer le code de réduction de la seconde relance. Tu peux le désinstaller en un clic depuis ton admin Shopify.",
  },
  {
    q: "Et si je veux arrêter ?",
    a: `Tu résilies quand tu veux, par simple email, sans frais. Pendant les ${GUARANTEE.days} premiers jours, tu es en plus remboursé en totalité, sous ${GUARANTEE.refundDays} jours.`,
  },
];

export default function Home() {
  return (
    <>
      <HomeHeader />

      <main className="flex-1">
        <Scrolly />

        {/* Bandeau de confiance */}
        <section aria-label="Garanties" className="border-y border-line bg-white px-4 py-5">
          <ul className="mx-auto grid max-w-6xl grid-cols-2 gap-x-6 gap-y-3 text-sm font-medium text-ink sm:grid-cols-4">
            {[
              ["Fonctionne avec Shopify", "Branchement officiel, désinstallable en 1 clic"],
              ["Paiement sécurisé", "Par carte, via Stripe"],
              ["Données en Europe", "Base de données hébergée dans l’UE"],
              ["Support en français", SITE.contact],
            ].map(([t, d]) => (
              <li key={t} className="flex flex-col">
                <span className="flex items-center gap-2">
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-bottle text-[0.65rem] text-white">✓</span>
                  {t}
                </span>
                <span className="pl-7 text-xs font-normal text-muted">{d}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* En clair, sans animation : à quoi ça sert, en 3 étapes */}
        <section className="scroll-mt-16 bg-paper px-4 py-16 sm:py-24" aria-labelledby="comment" id="comment-section">
          <div className="mx-auto max-w-6xl">
            <p className="text-[0.8rem] font-semibold uppercase tracking-[0.18em] text-brick-dark">En clair</p>
            <h2 id="comment" className="scroll-mt-24 mt-3 font-poster text-[clamp(2.2rem,8vw,4.5rem)] uppercase leading-[0.95] text-ink">
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

        {/* Ce que reçoit le client de la boutique */}
        <section className="scroll-mt-16 bg-[#eef3f8] px-4 py-16 sm:py-24" aria-labelledby="email">
          <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2">
            <div>
              <p className="text-[0.8rem] font-semibold uppercase tracking-[0.18em] text-[#0f3550]">La relance</p>
              <h2 id="email" className="scroll-mt-24 mt-3 font-poster text-[clamp(2.2rem,8vw,4.5rem)] uppercase leading-[0.95] text-ink">
                Ce que reçoit ton client
              </h2>
              <ul className="mt-6 space-y-3 text-lg leading-snug">
                <li className="flex gap-3"><span className="text-bottle">✓</span><span>Un email au nom de <b>ta</b> boutique, pas de la nôtre</span></li>
                <li className="flex gap-3"><span className="text-bottle">✓</span><span>Son prénom, ses articles, un bouton pour reprendre</span></li>
                <li className="flex gap-3"><span className="text-bottle">✓</span><span>S’il répond, la réponse arrive chez toi</span></li>
                <li className="flex gap-3"><span className="text-bottle">✓</span><span>Un lien pour ne plus rien recevoir, respecté automatiquement</span></li>
              </ul>
            </div>
            <figure className="rounded-3xl bg-white p-2 shadow-[0_40px_80px_-30px_rgba(15,53,80,0.45)]">
              <div className="rounded-2xl border border-line">
                <div className="space-y-1 border-b border-line px-5 py-4 text-sm">
                  <p><span className="text-muted">De :</span> <b>Atelier Lune</b> <span className="text-muted">· il y a 1 h</span></p>
                  <p><span className="text-muted">Objet :</span> <b>Tu as oublié quelque chose ?</b></p>
                </div>
                <div className="space-y-4 px-5 py-5 leading-relaxed">
                  <p>Bonjour Julie,</p>
                  <p>Ton panier t’attend toujours chez Atelier Lune. On l’a mis de côté, tel que tu l’as laissé :</p>
                  <p className="text-muted">1 × Bougie Figue noire<br />1 × Plaid lin sauge</p>
                  <p className="inline-block rounded-lg bg-ink px-5 py-3 font-semibold text-white">Reprendre mon panier</p>
                  <p className="text-xs text-muted">Ne plus recevoir ces messages</p>
                </div>
              </div>
              <figcaption className="px-3 py-2 text-xs text-muted">Exemple de relance 1. Boutique et cliente fictives.</figcaption>
            </figure>
          </div>
        </section>

        {/* Tarifs, en clair */}
        <section className="scroll-mt-16 bg-paper px-4 py-16 sm:py-24" aria-labelledby="tarifs">
          <div className="mx-auto max-w-6xl">
            <p className="text-[0.8rem] font-semibold uppercase tracking-[0.18em] text-brick-dark">Tarifs</p>
            <h2 id="tarifs" className="scroll-mt-24 mt-3 font-poster text-[clamp(2.2rem,8vw,4.5rem)] uppercase leading-[0.95] text-ink">
              Un prix simple, relances illimitées
            </h2>
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {PLAN_ORDER.map((id) => {
                const p = PLANS[id];
                const featured = id === "fondateur";
                return (
                  <div
                    key={id}
                    className={`relative flex flex-col rounded-3xl p-6 ${
                      featured ? "bg-ink text-paper shadow-[0_30px_60px_-25px_rgba(0,0,0,0.6)]" : "border border-line bg-white"
                    }`}
                  >
                    {featured && (
                      <span className="absolute -top-3 left-6 rounded-full bg-[#ff6b1a] px-3 py-1 text-xs font-semibold text-ink">
                        Recommandé
                      </span>
                    )}
                    <h3 className="text-lg font-semibold">{p.name}</h3>
                    <p className={`text-sm ${featured ? "text-paper/70" : "text-muted"}`}>{p.note}</p>
                    <p className="mt-6 font-poster text-6xl leading-none num">
                      {euros(p.cents / 100)}
                      <span className={`ml-1 font-sans text-base ${featured ? "text-paper/70" : "text-muted"}`}>
                        /{p.interval === "year" ? "an" : "mois"}
                      </span>
                    </p>
                    <p className={`mt-2 text-sm num ${featured ? "text-paper/70" : "text-muted"}`}>
                      soit {euros2(perDay(id))} par jour
                    </p>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 rounded-2xl border-2 border-bottle bg-white p-5 sm:flex sm:items-center sm:justify-between sm:gap-6">
              <p className="font-semibold text-bottle">Satisfait ou remboursé {GUARANTEE.days} jours</p>
              <p className="mt-1 text-sm leading-relaxed text-muted sm:mt-0 sm:max-w-2xl">
                Un simple email dans les {GUARANTEE.days} jours suivant ton paiement, sans justification : remboursement
                complet sur ta carte sous {GUARANTEE.refundDays} jours. Sans engagement, résiliable à tout moment.
              </p>
            </div>
            <div className="mt-8 flex flex-col items-center gap-2 sm:flex-row sm:gap-4">
              <CtaButton className="w-full sm:w-fit" />
              <span className="text-sm text-muted">Tu vois ton chiffre avant de payer quoi que ce soit.</span>
            </div>
          </div>
        </section>

        {/* Questions fréquentes */}
        <section className="scroll-mt-16 bg-white px-4 py-16 sm:py-24" aria-labelledby="faq">
          <div className="mx-auto max-w-3xl">
            <h2 id="faq" className="scroll-mt-24 font-poster text-[clamp(2.2rem,8vw,4.5rem)] uppercase leading-[0.95] text-ink">
              Questions fréquentes
            </h2>
            <div className="mt-8 divide-y divide-line border-y border-line">
              {FAQ.map((f) => (
                <details key={f.q} className="group py-1">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-lg font-semibold">
                    {f.q}
                    <span className="text-2xl leading-none text-muted transition-transform group-open:rotate-45" aria-hidden>
                      +
                    </span>
                  </summary>
                  <p className="pb-5 leading-relaxed text-muted">{f.a}</p>
                </details>
              ))}
            </div>
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
        <CtaButton className="w-full shadow-[0_10px_30px_-8px_rgba(0,0,0,0.45)] ring-1 ring-white/20" />
      </div>

      <Footer />
      <div className="h-24 sm:hidden" aria-hidden="true" />
    </>
  );
}
