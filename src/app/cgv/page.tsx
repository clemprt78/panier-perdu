import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { SITE } from "@/lib/site";
import { GUARANTEE, LAUNCH_DATE_LABEL } from "@/lib/diagnostic";

export const metadata: Metadata = { title: "Conditions générales de vente" };

export default function Page() {
  return (
    <LegalPage title="Conditions générales de vente" updated="22 octobre 2026">
      <h2>1. Objet</h2>
      <p>
        Les présentes conditions encadrent la vente de l&apos;abonnement Panier Perdu par <mark>[Prénom Nom]</mark>,
        SIRET <mark>[numéro SIRET]</mark> (ci-après « l&apos;éditeur »), à des boutiques en ligne (ci-après « le
        client »). Le service s&apos;adresse aux professionnels.
      </p>
      <h2>2. Le service</h2>
      <p>L&apos;abonnement comprend :</p>
      <ul>
        <li>
          dès le paiement : un plan de relance personnalisé (deux emails de relance rédigés pour la boutique, un code de
          réduction recommandé et quatre réglages), envoyé par email et affiché à l&apos;écran ;
        </li>
        <li>
          l&apos;outil automatique de relance (branchement à la boutique Shopify, lecture des paniers abandonnés, envoi
          de deux relances, code de réduction facultatif sur la seconde, compteur du chiffre d&apos;affaires récupéré),
          mis en service {LAUNCH_DATE_LABEL} à compter du paiement. À défaut, le client est remboursé en totalité sur
          simple demande.
        </li>
      </ul>
      <p>
        Les montants récupérés affichés avant l&apos;achat sont des estimations fondées sur des moyennes du secteur. Ils
        ne constituent pas une garantie de résultat.
      </p>
      <h2>3. Prix et paiement</h2>
      <p>
        Formules : Mensuel 39 € par mois, Fondateur 29 € par mois (réservée aux 20 premiers clients, prix maintenu tant
        que l&apos;abonnement n&apos;est pas résilié), Annuel 390 € par an. <mark>[TVA non applicable, article 293 B du
        CGI — à confirmer selon ton régime]</mark>. Le paiement s&apos;effectue par carte bancaire via Stripe. L&apos;éditeur
        n&apos;a jamais accès aux numéros de carte.
      </p>
      <h2>4. Durée et résiliation</h2>
      <p>
        L&apos;abonnement est sans engagement et se renouvelle automatiquement à chaque échéance (mois ou année). Le
        client peut le résilier à tout moment par email à {SITE.contact}. La résiliation prend effet à la fin de la
        période en cours ; aucun prélèvement n&apos;a lieu ensuite.
      </p>
      <h2>5. Garantie satisfait ou remboursé</h2>
      <p>
        Pendant {GUARANTEE.days} jours à compter du premier paiement, le client peut demander le remboursement intégral
        de ce paiement par simple email à {SITE.contact}, sans avoir à se justifier. Le remboursement est effectué sur
        la carte utilisée, sous {GUARANTEE.refundDays} jours à compter de la demande, et l&apos;abonnement est résilié.
      </p>
      <h2>6. Obligations du client</h2>
      <p>
        Le client reste responsable des emails envoyés à ses propres clients et du respect des règles applicables à la
        prospection et aux données personnelles de ses clients.
      </p>
      <h2>7. Responsabilité</h2>
      <p>
        L&apos;éditeur est tenu d&apos;une obligation de moyens. Sa responsabilité est limitée au montant payé par le
        client au cours des douze derniers mois.
      </p>
      <h2>8. Droit applicable</h2>
      <p>
        Les présentes conditions sont soumises au droit français. En cas de litige, une solution amiable sera recherchée
        avant toute action. À défaut, les tribunaux compétents sont ceux du ressort de <mark>[ville du domicile de
        l&apos;éditeur]</mark>.
      </p>
    </LegalPage>
  );
}
