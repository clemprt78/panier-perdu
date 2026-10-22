"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

// Le récit qui défile : le fond change de couleur, le grand titre change derrière,
// et le ticket de caisse au centre suit l'histoire d'un panier.

type Step = {
  bg: string;
  ink: string; // couleur du grand titre
  text: string; // couleur du petit texte
  kicker: string;
  title: string;
  body: string;
};

const STEPS: Step[] = [
  {
    bg: "#eadfcc",
    ink: "#1f3d2b",
    text: "#3d3a33",
    kicker: "Pour les boutiques Shopify de 10 à 150 commandes par mois",
    title: "Récupère les paniers abandonnés de ta boutique.",
    body: "Deux relances bien écrites, envoyées au bon moment. Et le chiffre d’affaires récupéré, en euros. 39 € par mois.",
  },
  {
    bg: "#cfc8f3",
    ink: "#2b2166",
    text: "#2f2a4d",
    kicker: "Le constat",
    title: "7 paniers sur 10 ne sont jamais payés.",
    body: "La plupart des petites boutiques ne relancent personne. Les outils pros coûtent cher, et l’email par défaut part une fois, puis plus rien.",
  },
  {
    bg: "#cfe4f3",
    ink: "#0f3550",
    text: "#1f3a4d",
    kicker: "1 heure après",
    title: "Relance 1. Humaine, à son prénom.",
    body: "Écrite pour ta boutique, avec ce qu’il y avait dans son panier. Pas de « Cher client », pas de ton robot.",
  },
  {
    bg: "#d3ead9",
    ink: "#1f3d2b",
    text: "#26402f",
    kicker: "24 heures après",
    title: "Relance 2. Un code, seulement s’il hésite.",
    body: "Un code unique de −10 %, valable 48 heures. Ceux qui reviennent d’eux-mêmes paient plein tarif.",
  },
  {
    bg: "#ff6b1a",
    ink: "#fff8ef",
    text: "#2a1406",
    kicker: "Chaque mois",
    title: "Tu vois ce que ça rapporte. En euros.",
    body: "Un compteur des ventes récupérées grâce aux relances. Estimation prudente pour une boutique à 35 commandes par mois.",
  },
];

export default function Scrolly() {
  const [active, setActive] = useState(0);
  const triggers = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.step));
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    triggers.current.forEach((t) => t && io.observe(t));
    return () => io.disconnect();
  }, []);

  const s = STEPS[active];

  return (
    <section aria-label="Comment ça marche" className="relative">
      {/* La scène, collée à l'écran pendant le défilement */}
      <div
        className="sticky top-0 h-[100svh] overflow-hidden transition-colors duration-700 motion-reduce:transition-none"
        style={{ background: s.bg }}
      >
        {/* Formes floues décoratives */}
        <div aria-hidden className="pointer-events-none absolute -left-24 top-1/3 h-72 w-72 rounded-full bg-white/40 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -right-20 bottom-10 h-80 w-80 rounded-full bg-black/5 blur-3xl" />

        <div className="relative mx-auto flex h-full max-w-6xl flex-col px-4 pt-20 pb-28 sm:pb-16 lg:flex-row lg:items-center lg:gap-10">
          {/* Grands titres empilés : un seul visible à la fois */}
          <div className="relative min-h-[34svh] flex-1 lg:min-h-0 lg:h-[70svh]">
            {STEPS.map((st, i) => {
              const Tag = i === 0 ? "h1" : "h2";
              return (
                <div
                  key={i}
                  aria-hidden={i !== active}
                  className={`absolute inset-0 flex flex-col justify-center transition-all duration-500 motion-reduce:transition-none ${
                    i === active ? "translate-y-0 opacity-100" : i < active ? "-translate-y-6 opacity-0" : "translate-y-6 opacity-0"
                  }`}
                >
                  <p className="text-[0.8rem] font-semibold uppercase tracking-[0.18em]" style={{ color: st.text }}>
                    {st.kicker}
                  </p>
                  <Tag
                    className="mt-3 font-poster uppercase leading-[0.92] text-[clamp(2.6rem,12.5vw,7.5rem)] lg:text-[clamp(4rem,7.2vw,7.5rem)]"
                    style={{ color: st.ink }}
                  >
                    {st.title}
                  </Tag>
                </div>
              );
            })}
          </div>

          {/* Le ticket de caisse : il raconte l'histoire du panier */}
          <div className="relative z-10 mx-auto w-full max-w-[22rem] lg:mx-0 lg:w-[22rem]">
            <Ticket step={active} />
            <p
              className="mt-4 text-[0.98rem] leading-relaxed transition-colors duration-700 lg:text-base [@media(max-height:740px)_and_(max-width:1023px)]:hidden"
              style={{ color: s.text }}
            >
              {s.body}
            </p>
          </div>
        </div>

        {/* Repères de progression */}
        <div className="absolute right-3 top-1/2 hidden -translate-y-1/2 flex-col gap-2 sm:flex" aria-hidden>
          {STEPS.map((_, i) => (
            <span
              key={i}
              className="h-2 w-2 rounded-full transition-all"
              style={{ background: s.ink, opacity: i === active ? 1 : 0.3, transform: i === active ? "scale(1.4)" : "none" }}
            />
          ))}
        </div>
      </div>

      {/* Les déclencheurs invisibles : un écran de défilement par étape */}
      <div className="pointer-events-none relative -mt-[100svh]" aria-hidden>
        {STEPS.map((_, i) => (
          <div
            key={i}
            data-step={i}
            ref={(el) => {
              triggers.current[i] = el;
            }}
            className="h-[100svh]"
          />
        ))}
      </div>
    </section>
  );
}

function Row({ k, v, on, strong }: { k: string; v: string; on: boolean; strong?: boolean }) {
  return (
    <div
      className={`flex items-baseline justify-between gap-3 overflow-hidden transition-all duration-500 motion-reduce:transition-none ${
        on ? "max-h-10 py-[3px] opacity-100" : "max-h-0 py-0 opacity-0"
      }`}
    >
      <dt className="text-[0.92rem] text-muted">{k}</dt>
      <dd className={`num text-[0.95rem] ${strong ? "font-semibold text-bottle" : "font-medium text-ink"}`}>{v}</dd>
    </div>
  );
}

function Ticket({ step }: { step: number }) {
  const total =
    step >= 4
      ? { label: "Récupéré ce mois-ci", value: "+134 €", color: "text-bottle" }
      : { label: "Laissé sur la table", value: "3 690 €", color: "text-brick" };

  return (
    <div className="ticket px-5 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.35)]">
      <p className="text-[0.7rem] uppercase tracking-widest text-muted">Boutique type · un mois</p>
      <dl className="mt-2">
        <Row k="Commandes payées" v="35" on={step <= 1} />
        <Row k="Paniers abandonnés" v="82" on={step <= 2} strong={step === 1} />
        <Row k="Clients relancés" v="0" on={step <= 1} />
        <Row k="Relance 1 · après 1 h" v="envoyée" on={step >= 2} strong={step === 2} />
        <Row k="Relance 2 · après 24 h" v="envoyée" on={step >= 3} strong={step === 3} />
        <Row k="Code unique −10 %" v="RETOUR-A3F9" on={step === 3} />
        <Row k="Commandes récupérées" v="≈ 3" on={step >= 4} strong />
      </dl>
      <div className="dashed my-3" />
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[0.95rem] font-medium">{total.label}</span>
        <span className={`font-poster text-[2.1rem] leading-none num ${total.color}`}>{total.value}</span>
      </div>
      <p className="mt-2 text-[0.72rem] text-muted">35 commandes, panier moyen de 45 €. Estimation.</p>
    </div>
  );
}

export function CtaButton({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/diagnostic"
      className={`flex h-14 items-center justify-center rounded-full bg-ink px-8 text-lg font-semibold text-white active:scale-[0.98] hover:bg-black ${className}`}
    >
      Commencer, c&apos;est gratuit
    </Link>
  );
}
