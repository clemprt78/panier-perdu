import Link from "next/link";
import { SITE } from "@/lib/site";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-line px-4 py-8 text-sm text-muted">
      <div className="mx-auto max-w-2xl flex flex-col gap-3">
        <p className="font-display font-semibold text-bottle">{SITE.name}</p>
        <nav className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Informations légales">
          <Link className="underline underline-offset-4 py-1" href="/connexion">Espace client</Link>
          <Link className="underline underline-offset-4 py-1" href="/mentions-legales">Mentions légales</Link>
          <Link className="underline underline-offset-4 py-1" href="/cgv">CGV</Link>
          <Link className="underline underline-offset-4 py-1" href="/confidentialite">Confidentialité</Link>
        </nav>
        <p>
          Une question ? <span className="text-ink">{SITE.contact}</span>
        </p>
      </div>
    </footer>
  );
}
