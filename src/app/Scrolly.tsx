"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

// Le récit en 5 « slides » plein écran : le fond change de couleur, un titre géant
// en relief change derrière, des objets 3D flottent, et le ticket de caisse au centre
// pivote à chaque étape pour raconter l'histoire d'un panier.

type Step = {
  bg: string;
  glow: string; // lueur colorée en fond
  ink: string; // relief du titre et couleurs fortes
  text: string; // petits textes
  kicker: string;
  title: string;
  body: string;
};

const STEPS: Step[] = [
  {
    bg: "#eadfcc",
    glow: "#ffffff",
    ink: "#1f3d2b",
    text: "#2f2c26",
    kicker: "Pour les boutiques Shopify",
    title: "Récupère les paniers abandonnés de ta boutique.",
    body: "",
  },
  {
    bg: "#c9c1f5",
    glow: "#f3efff",
    ink: "#2b2166",
    text: "#26214a",
    kicker: "Le constat",
    title: "7 paniers sur 10 ne sont jamais payés.",
    body: "La plupart des petites boutiques ne relancent personne. Les outils pros coûtent cher, et l’email par défaut part une fois, puis plus rien.",
  },
  {
    bg: "#c6e0f4",
    glow: "#f0f8ff",
    ink: "#0f3550",
    text: "#17324a",
    kicker: "1 heure après",
    title: "Relance 1. Humaine, à son prénom.",
    body: "Écrite pour ta boutique, avec ce qu’il y avait dans son panier. Pas de « Cher client », pas de ton robot.",
  },
  {
    bg: "#cbe9d4",
    glow: "#f2fff6",
    ink: "#1f3d2b",
    text: "#1f3628",
    kicker: "24 heures après",
    title: "Relance 2. Un code, seulement s’il hésite.",
    body: "Un code unique de −10 %, valable 48 heures. Ceux qui reviennent d’eux-mêmes paient plein tarif.",
  },
  {
    bg: "#ff6b1a",
    glow: "#ffd2a8",
    ink: "#2a1406",
    text: "#2a1406",
    kicker: "Chaque mois",
    title: "Tu vois ce que ça rapporte. En euros.",
    body: "Un compteur des ventes récupérées grâce aux relances. Estimation prudente pour une boutique à 35 commandes par mois.",
  },
];

// Relief façon « titre en 3D » : couches d'ombre décalées dans la couleur forte.
const extrude = (c: string) =>
  [1, 2, 3, 4, 5].map((i) => `${i}px ${i}px 0 ${c}b3`).join(", ") + `, 6px 14px 30px rgba(0,0,0,0.22)`;

export default function Scrolly() {
  const [active, setActive] = useState(0);
  const stage = useRef<HTMLDivElement>(null);
  const section = useRef<HTMLElement>(null);
  const tilt = useRef<HTMLDivElement>(null);

  // Progression continue du défilement → variable CSS --p (0 à 4) pour le parallaxe.
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = section.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = Math.min(Math.max(-r.top / vh, 0), STEPS.length - 1);
      stage.current?.style.setProperty("--p", p.toFixed(3));
      const next = Math.min(STEPS.length - 1, Math.max(0, Math.round(p)));
      setActive((cur) => (cur === next ? cur : next));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // Sur ordinateur : le ticket s'incline vers la souris.
  useEffect(() => {
    if (window.matchMedia("(pointer: coarse), (prefers-reduced-motion: reduce)").matches) return;
    const onMove = (e: PointerEvent) => {
      const x = e.clientX / window.innerWidth - 0.5;
      const y = e.clientY / window.innerHeight - 0.5;
      tilt.current?.style.setProperty("--rx", `${(-y * 10).toFixed(2)}deg`);
      tilt.current?.style.setProperty("--ry", `${(x * 14).toFixed(2)}deg`);
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  const s = STEPS[active];

  return (
    <section ref={section} aria-label="Comment ça marche" className="relative" data-home-slides>
      <div
        ref={stage}
        className="pp-stage sticky top-0 h-[100svh] overflow-hidden transition-[background-color] duration-700 motion-reduce:transition-none"
        style={{ background: s.bg, ["--p" as string]: "0", ["--ink" as string]: s.ink, ["--glow" as string]: s.glow }}
      >
        {/* Lueur qui suit les étapes */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 h-[120vmax] w-[120vmax] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-70 transition-[background] duration-700"
          style={{ background: `radial-gradient(circle at 60% 45%, ${s.glow} 0%, transparent 45%)` }}
        />

        {/* Mot géant en contour qui glisse avec le défilement */}
        <div
          aria-hidden
          className="pp-marquee pointer-events-none absolute left-0 top-[58%] whitespace-nowrap font-poster uppercase leading-none text-transparent"
          style={{ WebkitTextStroke: `1.5px ${s.ink}` }}
        >
          Panier Perdu · Panier Récupéré · Panier Perdu · Panier Récupéré ·
        </div>

        {/* Objets 3D flottants (CSS pur, aucune image) */}
        <Shapes ink={s.ink} />

        {/* Grain discret façon affiche */}
        <div aria-hidden className="pp-grain pointer-events-none absolute inset-0" />

        <div className="relative mx-auto flex h-full max-w-6xl flex-col px-4 pt-20 pb-24 sm:pb-16 lg:flex-row lg:items-center lg:gap-12">
          {/* Titres : un seul visible à la fois, révélé par un rideau */}
          <div className="relative min-h-[42svh] flex-1 lg:h-[70svh] lg:min-h-0">
            {STEPS.map((st, i) => {
              const Tag = i === 0 ? "h1" : "h2";
              const on = i === active;
              return (
                <div
                  key={i}
                  aria-hidden={!on}
                  className={`absolute inset-0 flex flex-col justify-center transition-[opacity,transform,clip-path] duration-700 ease-[cubic-bezier(.2,.8,.2,1)] motion-reduce:transition-none ${
                    on ? "opacity-100" : "pointer-events-none opacity-0"
                  }`}
                  style={{
                    transform: on ? "none" : i < active ? "translateY(-40px) scale(.96)" : "translateY(40px) scale(.96)",
                    clipPath: on ? "inset(0 0 0 0)" : i < active ? "inset(0 0 100% 0)" : "inset(100% 0 0 0)",
                  }}
                >
                  <p className="flex items-center gap-3 text-[0.78rem] font-semibold uppercase tracking-[0.2em] [@media(max-height:740px)_and_(max-width:1023px)]:hidden" style={{ color: st.text }}>
                    <span className="num rounded-full border px-2 py-0.5 text-[0.7rem]" style={{ borderColor: st.text }}>
                      0{i + 1}
                    </span>
                    {st.kicker}
                  </p>
                  <Tag
                    className={`mt-4 font-poster uppercase leading-[0.9] lg:text-[clamp(4rem,7.3vw,7.8rem)] ${
                      i === 0 ? "text-[clamp(2.3rem,10.5vw,7.8rem)]" : "text-[clamp(2.6rem,12.5vw,7.8rem)]"
                    }`}
                    style={{ color: "#fffdf8", textShadow: extrude(st.ink) }}
                  >
                    {st.title}
                  </Tag>
                  {i === 0 && (
                    <>
                      <p className="mt-4 max-w-lg text-[1.05rem] font-medium leading-snug sm:text-xl" style={{ color: st.text }}>
                        Un client part sans payer ? Panier Perdu lui envoie <b>deux emails automatiques</b>. Il revient,
                        tu encaisses.
                      </p>
                      <ul className="mt-4 flex flex-wrap gap-1.5 text-[0.74rem] font-semibold sm:gap-2 sm:text-sm" style={{ color: st.text }}>
                        {["Sans engagement", "Remboursé 30 jours", "Prêt en 10 min"].map((t) => (
                          <li key={t} className="rounded-full bg-white/60 px-2.5 py-1 backdrop-blur-sm">
                            ✓ {t}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Le ticket 3D */}
          <div className="relative z-10 mx-auto w-full max-w-[22rem] lg:mx-0 lg:w-[23rem]">
            <div ref={tilt} className="pp-tilt">
              <div key={active} className="pp-flip">
                <div className="pp-float">
                  {active === 0 ? <FlowCard /> : <Ticket step={active} />}
                </div>
              </div>
            </div>
            {s.body && <p
              className="mt-5 text-[0.98rem] leading-relaxed transition-colors duration-700 lg:text-base [@media(max-height:900px)_and_(max-width:1023px)]:hidden"
              style={{ color: s.text }}
            >
              {s.body}
            </p>}
          </div>
        </div>

        {/* Compteur de slides + barre de progression */}
        <div className="absolute bottom-6 left-4 hidden items-center gap-4 sm:flex lg:left-[max(1rem,calc(50%-36rem))]" aria-hidden>
          <span className="num font-poster text-2xl" style={{ color: s.ink }}>
            0{active + 1}
            <span className="opacity-40"> / 0{STEPS.length}</span>
          </span>
          <span className="relative h-[3px] w-40 overflow-hidden rounded-full" style={{ background: `${s.ink}33` }}>
            <span className="pp-progress absolute inset-y-0 left-0 rounded-full" style={{ background: s.ink }} />
          </span>
        </div>
      </div>

      {/* Un écran de défilement par slide, avec aimantation */}
      <div className="pointer-events-none relative -mt-[100svh]" aria-hidden>
        {STEPS.map((_, i) => (
          <div key={i} className="h-[100svh] snap-start" />
        ))}
      </div>
    </section>
  );
}

function Shapes({ ink }: { ink: string }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {/* Sphère en verre */}
      <div className="pp-par absolute right-[-6%] top-[7%] sm:right-[8%] sm:top-[14%] [--depth:-60px]">
        <div
          className="pp-bob h-20 w-20 rounded-full opacity-80 sm:h-40 sm:w-40 sm:opacity-100"
          style={{
            background: `radial-gradient(circle at 32% 28%, #ffffff 0%, rgba(255,255,255,.75) 14%, ${ink}55 55%, ${ink}cc 100%)`,
            boxShadow: `0 30px 60px -20px ${ink}88, inset -12px -16px 30px ${ink}66`,
          }}
        />
      </div>

      {/* Cube 3D qui tourne */}
      <div className="pp-par absolute left-[28%] top-[6%] hidden sm:block [--depth:90px]">
        <div className="pp-cube-wrap">
          <div className="pp-cube">
            {["front", "back", "right", "left", "top", "bottom"].map((f) => (
              <span
                key={f}
                className={`pp-face pp-${f}`}
                style={{ background: `linear-gradient(135deg, rgba(255,255,255,.85), ${ink}44)`, borderColor: `${ink}55` }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Anneau chromé */}
      <div className="pp-par absolute bottom-[16%] right-[18%] hidden sm:block [--depth:140px]">
        <div
          className="pp-spin h-20 w-20 rounded-full sm:h-28 sm:w-28"
          style={{
            border: "14px solid transparent",
            background: `conic-gradient(from 0deg, #ffffff, ${ink}, #ffffff, ${ink}88, #ffffff) border-box`,
            WebkitMask: "linear-gradient(#000 0 0) padding-box exclude, linear-gradient(#000 0 0)",
            mask: "linear-gradient(#000 0 0) padding-box exclude, linear-gradient(#000 0 0)",
            filter: `drop-shadow(0 18px 24px ${ink}66)`,
          }}
        />
      </div>

      {/* Petite pastille « -10 % » */}
      <div className="pp-par absolute left-[46%] top-[10%] hidden lg:block [--depth:-30px]">
        <div
          className="pp-bob grid h-16 w-16 place-items-center rounded-full font-poster text-lg text-white"
          style={{ background: ink, boxShadow: `0 16px 30px -10px ${ink}` }}
        >
          −10%
        </div>
      </div>
    </div>
  );
}

// Le produit en une image : panier abandonné → relance automatique → vente récupérée.
function FlowCard() {
  const steps = [
    { icon: <CartIcon />, title: "Julie abandonne son panier", meta: "64 € · 14:02", tone: "bg-[#f3e2d8] text-brick-dark" },
    { icon: <MailIcon />, title: "Panier Perdu la relance", meta: "Email automatique · 15:02", tone: "bg-[#dfe7f3] text-[#0f3550]" },
    { icon: <CheckIcon />, title: "Julie commande", meta: "Vente récupérée", tone: "bg-[#d6ecdd] text-bottle" },
  ];
  return (
    <div className="rounded-2xl bg-[#fffdf8] p-4 shadow-[0_40px_70px_-25px_rgba(0,0,0,0.45)]">
      <p className="px-1 text-[0.7rem] uppercase tracking-widest text-muted">Ce que fait Panier Perdu</p>
      <ol className="mt-3">
        {steps.map((st, i) => (
          <li key={st.title} className="pp-rise relative flex gap-3 pb-3 last:pb-0" style={{ animationDelay: `${0.15 + i * 0.35}s` }}>
            {i < steps.length - 1 && (
              <span aria-hidden className="absolute left-[19px] top-10 bottom-0 border-l-2 border-dashed border-line" />
            )}
            <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${st.tone}`}>{st.icon}</span>
            <span className="flex flex-1 items-center justify-between gap-2">
              <span>
                <span className="block text-[0.95rem] font-semibold leading-tight text-ink">{st.title}</span>
                <span className="block text-[0.8rem] text-muted">{st.meta}</span>
              </span>
              {i === steps.length - 1 && <span className="font-poster text-[1.7rem] leading-none text-bottle num">+64 €</span>}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

const svg = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
function CartIcon() {
  return (
    <svg {...svg}>
      <circle cx="9" cy="20" r="1.4" />
      <circle cx="18" cy="20" r="1.4" />
      <path d="M2 3h3l2.6 12.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 1.9-1.5L21 8H6" />
    </svg>
  );
}
function MailIcon() {
  return (
    <svg {...svg}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg {...svg}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function Row({ k, v, on, strong }: { k: string; v: string; on: boolean; strong?: boolean }) {
  if (!on) return null;
  return (
    <div className="flex items-baseline justify-between gap-3 py-[3px]">
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
    <div className="ticket px-5 shadow-[0_40px_70px_-25px_rgba(0,0,0,0.45)]">
      <div className="flex items-center justify-between">
        <p className="text-[0.7rem] uppercase tracking-widest text-muted">Boutique type · un mois</p>
        <span className="num text-[0.7rem] text-muted">#0{step + 1}</span>
      </div>
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
        <span className={`font-poster text-[2.2rem] leading-none num ${total.color}`}>{total.value}</span>
      </div>
      <p className="mt-2 text-[0.72rem] text-muted">35 commandes, panier moyen de 45 €. Estimation.</p>
    </div>
  );
}

export function CtaButton({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/diagnostic"
      className={`group relative flex h-14 items-center justify-center gap-2 overflow-hidden rounded-full bg-ink px-8 text-lg font-semibold text-white active:scale-[0.98] ${className}`}
    >
      <span className="pp-shine pointer-events-none absolute inset-0" aria-hidden />
      <span className="relative">Commencer, c&apos;est gratuit</span>
      <span className="relative transition-transform group-hover:translate-x-1" aria-hidden>
        →
      </span>
    </Link>
  );
}
