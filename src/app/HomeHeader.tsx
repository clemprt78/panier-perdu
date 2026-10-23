"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Logo from "@/components/Logo";

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
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <Logo />
        <nav className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/connexion"
            className="rounded-full border-2 border-ink px-4 py-2 text-sm font-semibold text-ink hover:bg-ink hover:text-white"
          >
            Espace client
          </Link>
          <Link
            href="/diagnostic"
            className="hidden rounded-full border-2 border-ink bg-ink px-5 py-2 text-sm font-semibold text-white hover:bg-black sm:inline-block"
          >
            Commencer, c&apos;est gratuit
          </Link>
        </nav>
      </div>
    </header>
  );
}
