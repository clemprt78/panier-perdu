import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import Footer from "@/components/Footer";
import LoginForm from "./LoginForm";

export const metadata: Metadata = { title: "Connexion", robots: { index: false } };

export default function ConnexionPage({ searchParams }: PageProps<"/connexion">) {
  return (
    <>
      <main className="flex-1 px-4 pt-5 pb-12">
        <div className="mx-auto max-w-md">
          <Link href="/" className="font-display text-lg font-semibold text-bottle py-2 inline-block">
            Panier Perdu
          </Link>
          <h1 className="mt-8 font-display text-[1.9rem] font-extrabold leading-tight">Accéder à mon espace</h1>
          <p className="mt-2 text-muted">Pas de mot de passe : on t&apos;envoie un lien de connexion par email.</p>
          <Suspense>
            <LinkError searchParams={searchParams} />
          </Suspense>
          <LoginForm />
          <p className="mt-8 text-sm text-muted">
            Pas encore client ?{" "}
            <Link href="/diagnostic" className="text-bottle underline underline-offset-4">
              Commence par le diagnostic gratuit
            </Link>
            .
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}

async function LinkError({ searchParams }: { searchParams: PageProps<"/connexion">["searchParams"] }) {
  const sp = await searchParams;
  if (sp.erreur !== "lien") return null;
  return (
    <p role="alert" className="mt-4 rounded-lg border-2 border-brick bg-white p-3 text-sm">
      Ce lien a expiré ou a déjà servi. Demande-en un nouveau ci-dessous.
    </p>
  );
}
