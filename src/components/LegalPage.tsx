import Link from "next/link";
import Footer from "@/components/Footer";

// Les mentions entre crochets [ ... ] sont à compléter avant le passage en production.
export default function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <>
      <main className="flex-1 px-4 pt-5 pb-12">
        <article className="mx-auto max-w-2xl leading-relaxed [&_h2]:mt-8 [&_h2]:font-semibold [&_h2]:text-lg [&_p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mt-1 [&_mark]:bg-brick/15 [&_mark]:px-1">
          <Link href="/" className="font-display text-xl uppercase tracking-wide text-ink py-2 inline-block">
            Panier Perdu
          </Link>
          <h1 className="mt-6 font-display uppercase text-[2.5rem] leading-tight">{title}</h1>
          <p className="text-sm text-muted">Mise à jour : {updated}</p>
          {children}
        </article>
      </main>
      <Footer />
    </>
  );
}
