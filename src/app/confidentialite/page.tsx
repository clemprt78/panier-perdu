import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Politique de confidentialité" };

export default function Page() {
  return (
    <LegalPage title="Politique de confidentialité" updated="22 octobre 2026">
      <h2>Responsable du traitement</h2>
      <p>
        <mark>[Prénom Nom]</mark>, SIRET <mark>[numéro SIRET]</mark>, joignable à {SITE.contact}.
      </p>
      <h2>Ce que nous collectons, et pourquoi</h2>
      <ul>
        <li>
          Tes réponses au diagnostic (commandes, panier moyen, situation, nom de boutique) : elles restent dans ton
          navigateur tant que tu ne paies pas. Au paiement, elles sont transmises pour préparer ton plan.
        </li>
        <li>Ton email et tes informations de paiement : pour l&apos;abonnement, la facturation et l&apos;envoi de ton plan.</li>
        <li>
          Une mesure d&apos;audience anonyme (pages vues), sans cookie et sans suivi d&apos;une page à l&apos;autre.
        </li>
      </ul>
      <h2>Base légale et durée</h2>
      <p>
        L&apos;exécution du contrat d&apos;abonnement. Les données sont conservées pendant l&apos;abonnement, puis le temps
        des obligations comptables (10 ans pour les factures).
      </p>
      <h2>Nos prestataires</h2>
      <ul>
        <li>Stripe (paiement) — les numéros de carte ne nous sont jamais transmis ;</li>
        <li>Resend (envoi des emails) ;</li>
        <li>Vercel (hébergement et mesure d&apos;audience anonyme).</li>
      </ul>
      <p>
        Certains de ces prestataires sont situés aux États-Unis et encadrent ces transferts par les garanties prévues
        par le RGPD.
      </p>
      <h2>Tes droits</h2>
      <p>
        Tu peux accéder à tes données, les corriger, les supprimer ou t&apos;opposer à leur utilisation en écrivant à{" "}
        {SITE.contact}. Tu peux aussi saisir la CNIL (cnil.fr).
      </p>
    </LegalPage>
  );
}
