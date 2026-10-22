import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Mentions légales" };

export default function Page() {
  return (
    <LegalPage title="Mentions légales" updated="22 octobre 2026">
      <h2>Éditeur du site</h2>
      <p>
        <mark>[Prénom Nom]</mark>, entrepreneur individuel (micro-entreprise)
        <br />
        SIRET : <mark>[numéro SIRET]</mark>
        <br />
        Adresse : <mark>[adresse postale]</mark>
        <br />
        Email : {SITE.contact}
        <br />
        Directeur de la publication : <mark>[Prénom Nom]</mark>
      </p>
      <h2>Hébergement</h2>
      <p>
        Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis — vercel.com
      </p>
      <h2>Propriété intellectuelle</h2>
      <p>
        Les textes, le logo et la mise en page de ce site appartiennent à l&apos;éditeur. Les modèles de relance fournis
        aux clients peuvent être librement utilisés par eux pour leur propre boutique.
      </p>
    </LegalPage>
  );
}
