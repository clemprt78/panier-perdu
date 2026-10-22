"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

// Transparent sur les slides, puis un fond clair dès qu'on arrive au contenu.
export default function HomeHeader() {
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const slides = document.querySelector("[data-home-slides]") as HTMLElement | null;
      const limit = slides ? slides.offsetTop + slides.offsetHeight - 64 : 0;
      setSolid(window.scrollY > limit);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-20 transition-[background-color,box-shadow] duration-300 ${
        solid ? "bg-paper/90 shadow-[0_1px_0_var(--color-line)] backdrop-blur-md" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="font-poster text-xl uppercase tracking-wide text-ink">
          Panier Perdu
        </Link>
        <nav className="flex items-center gap-5 text-sm font-medium text-ink">
          <a href="#tarifs" className="hidden py-2 hover:underline sm:inline">Tarifs</a>
          <a href="#faq" className="hidden py-2 hover:underline sm:inline">Questions</a>
          <Link href="/connexion" className="py-2 hover:underline">Connexion</Link>
          <Link
            href="/diagnostic"
            className="hidden rounded-full bg-ink px-5 py-2.5 font-semibold text-white hover:bg-black sm:inline-block"
          >
            Commencer, c&apos;est gratuit
          </Link>
        </nav>
      </div>
    </header>
  );
}
