"use client";

import Link from "next/link";

export default function Error({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <main className="flex-1 px-4 pt-16">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-display text-[1.75rem] font-extrabold leading-tight">Un souci de notre côté.</h1>
        <p className="mt-3 text-muted">Rien n&apos;est perdu. Réessaie, ou repars de l&apos;accueil.</p>
        <button
          type="button"
          onClick={() => retry()}
          className="mt-8 flex h-14 w-full items-center justify-center rounded-lg bg-brick font-semibold text-white"
        >
          Réessayer
        </button>
        <Link href="/" className="mt-3 flex h-12 items-center justify-center text-bottle underline underline-offset-4">
          Revenir à l&apos;accueil
        </Link>
      </div>
    </main>
  );
}
