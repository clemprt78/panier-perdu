import Link from "next/link";
import Footer from "@/components/Footer";

export default function NotFound() {
  return (
    <>
      <main className="flex-1 px-4 pt-16">
        <div className="mx-auto max-w-2xl">
          <p className="font-display text-6xl font-extrabold text-brick num">404</p>
          <h1 className="mt-4 font-display text-[1.75rem] font-extrabold leading-tight">Cette page s&apos;est perdue en route.</h1>
          <p className="mt-3 text-muted">Comme un panier abandonné. On te ramène à l&apos;accueil ?</p>
          <Link href="/" className="mt-8 flex h-14 items-center justify-center rounded-lg bg-brick font-semibold text-white">
            Revenir à l&apos;accueil
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
