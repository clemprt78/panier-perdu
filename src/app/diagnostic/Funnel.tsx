"use client";

import { useEffect, useState } from "react";
import {
  BASKET,
  HYP,
  ORDERS,
  TODAY,
  compute,
  euros,
  relance1,
  relance2,
  SETTINGS,
  type Answers,
} from "@/lib/diagnostic";
import Paywall from "./Paywall";
import Logo from "@/components/Logo";
import { PosterTitle } from "@/components/PosterTitle";

// Même univers que l'accueil : un fond plein par étape, des titres en relief.
const THEMES = [
  { bg: "#eadfcc", ink: "#1f3d2b" },
  { bg: "#c9c1f5", ink: "#2b2166" },
  { bg: "#c6e0f4", ink: "#0f3550" },
  { bg: "#cbe9d4", ink: "#1f3d2b" },
  { bg: "#eadfcc", ink: "#1f3d2b" },
  { bg: "#f6f2ea", ink: "#1f3d2b" },
] as const;


type Step = 0 | 1 | 2 | 3 | 4 | 5;
type Partial = { orders?: Answers["orders"]; basket?: Answers["basket"]; today?: Answers["today"]; shop: string };

const STORE_KEY = "pp-diagnostic";

const QUESTIONS = [
  {
    key: "orders" as const,
    title: "Combien de commandes fais-tu par mois ?",
    hint: "Une estimation suffit.",
    options: ORDERS.map((o) => ({ id: o.id, label: o.label })),
  },
  {
    key: "basket" as const,
    title: "Quel est ton panier moyen ?",
    hint: "Le montant moyen d'une commande.",
    options: BASKET.map((b) => ({ id: b.id, label: b.label })),
  },
  {
    key: "today" as const,
    title: "Quand un client abandonne son panier, que se passe-t-il aujourd'hui ?",
    hint: "Sois honnête, personne ne juge.",
    options: TODAY.map((t) => ({ id: t.id, label: t.label })),
  },
];

export default function Funnel() {
  const [step, setStep] = useState<Step>(0);
  const [a, setA] = useState<Partial>({ shop: "" });

  // Garde les réponses si la page est rechargée (rien n'est envoyé à un serveur).
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as { step: Step; a: Partial };
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setA(saved.a);
        setStep(saved.step);
      }
    } catch {}
  }, []);
  useEffect(() => {
    try {
      sessionStorage.setItem(STORE_KEY, JSON.stringify({ step, a }));
    } catch {}
  }, [step, a]);

  const go = (s: Step) => {
    setStep(s);
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  };

  const complete = a.orders && a.basket && a.today;
  const answers = complete ? ({ orders: a.orders, basket: a.basket, today: a.today, shop: a.shop } as Answers) : null;

  return (
    <main
      className="min-h-[100svh] flex-1 px-4 pb-12 transition-colors duration-700 motion-reduce:transition-none"
      style={{ background: THEMES[step].bg }}
    >
      <div className="mx-auto max-w-2xl">
        <header className="flex h-16 items-center justify-between">
          <Logo />
          {step > 0 && (
            <button
              type="button"
              onClick={() => go((step - 1) as Step)}
              className="rounded-full border-2 border-ink/20 px-4 py-2 text-sm font-semibold text-ink hover:border-ink"
            >
              ← Retour
            </button>
          )}
        </header>

        <div key={step} className="pp-enter">
        {step <= 2 && (
          <Question
            index={step}
            ink={THEMES[step].ink}
            selected={a[QUESTIONS[step].key]}
            onPick={(id) => {
              setA((prev) => ({ ...prev, [QUESTIONS[step].key]: id }));
              go((step + 1) as Step);
            }}
          />
        )}

        {step === 3 && answers && <Result a={answers} ink={THEMES[3].ink} onNext={() => go(4)} />}
        {step === 4 && answers && (
          <Preview a={answers} ink={THEMES[4].ink} setShop={(shop) => setA((p) => ({ ...p, shop }))} onNext={() => go(5)} />
        )}
        {step === 5 && answers && <Paywall a={answers} />}

        {step >= 3 && !answers && (
          <div className="mt-10">
            <p>Il manque une réponse.</p>
            <button className="mt-4 underline" onClick={() => go(0)}>
              Reprendre au début
            </button>
          </div>
        )}
        </div>
      </div>
    </main>
  );
}

function Question({
  index,
  ink,
  selected,
  onPick,
}: {
  index: number;
  ink: string;
  selected?: string;
  onPick: (id: string) => void;
}) {
  const q = QUESTIONS[index];
  return (
    <section className="mt-4 sm:mt-10">
      <div className="flex items-center gap-3">
        <div
          className="h-2 flex-1 overflow-hidden rounded-full bg-white/50"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={3}
          aria-valuenow={index + 1}
          aria-label="Progression"
        >
          <div className="h-full rounded-full transition-all" style={{ width: `${((index + 1) / 3) * 100}%`, background: ink }} />
        </div>
        <span className="font-poster text-lg num" style={{ color: ink }}>
          0{index + 1}<span className="opacity-40"> / 03</span>
        </span>
      </div>

      <PosterTitle ink={ink} className="mt-8">
        {q.title}
      </PosterTitle>
      <p className="mt-3 font-medium" style={{ color: ink }}>
        {q.hint}
      </p>

      <div className="mt-6 flex flex-col gap-3">
        {q.options.map((o, i) => (
          <button
            key={o.id}
            type="button"
            onClick={() => onPick(o.id)}
            className={`group flex min-h-16 items-center gap-4 rounded-2xl px-4 py-3 text-left text-lg font-semibold shadow-[0_12px_30px_-18px_rgba(0,0,0,0.5)] transition-all hover:-translate-y-0.5 active:scale-[0.99] ${
              selected === o.id ? "bg-ink text-white" : "bg-[#fffdf8] text-ink"
            }`}
          >
            <span
              className={`grid h-9 w-9 shrink-0 place-items-center rounded-full font-poster text-base ${
                selected === o.id ? "bg-white text-ink" : "text-white"
              }`}
              style={selected === o.id ? undefined : { background: ink }}
            >
              {"ABCD"[i]}
            </span>
            <span className="flex-1">{o.label}</span>
            <span className="text-xl opacity-30 transition-transform group-hover:translate-x-1" aria-hidden>
              →
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

function Result({ a, ink, onNext }: { a: Answers; ink: string; onNext: () => void }) {
  const r = compute(a);
  const today = TODAY.find((t) => t.id === a.today)!;
  const price = 39;
  const paysOff = r.gain >= price;

  const todayText =
    a.today === "t1"
      ? "Tu nous as dit que rien ne part. Aujourd'hui, tu ne récupères donc aucun de ces paniers."
      : a.today === "t2"
        ? `Tu relances à la main, quand tu y penses. Ça ramène environ ${euros(r.recoveredToday)} par mois, et ça te prend du temps.`
        : `L'email par défaut de Shopify en ramène environ ${euros(r.recoveredToday)} par mois. Un seul message, générique, sans seconde chance.`;

  return (
    <section className="mt-4 sm:mt-10">
      <p className="text-[0.8rem] font-semibold uppercase tracking-[0.2em]" style={{ color: ink }}>
        Ton résultat
      </p>
      <PosterTitle ink={ink} className="mt-3">
        Chaque mois, environ {euros(r.lostEuros)} restent dans tes paniers abandonnés.
      </PosterTitle>

      <div className="ticket mt-6 px-5 shadow-[0_30px_60px_-25px_rgba(0,0,0,0.45)]">
        <dl className="space-y-2 num">
          <TRow k="Tes commandes par mois" v={`≈ ${r.orders}`} />
          <TRow k="Paniers abandonnés" v={`≈ ${r.abandoned}`} />
          <TRow k="Dont avec un email (relançables)" v={`≈ ${r.reachable}`} />
          <TRow k="Récupéré aujourd'hui" v={euros(r.recoveredToday)} />
        </dl>
        <div className="dashed my-3" />
        <div className="flex items-baseline justify-between gap-3">
          <span className="font-medium leading-snug">En plus, avec 2 bonnes relances</span>
          <span className="font-display text-3xl text-bottle num whitespace-nowrap">
            +{euros(r.gain)}
          </span>
        </div>
        <p className="mt-1 text-right text-sm text-muted num">par mois, soit ≈ {r.ordersGained} commandes</p>
      </div>

      <p className="mt-6 leading-relaxed text-ink">{todayText}</p>

      {paysOff ? (
        <p className="mt-3 leading-relaxed">
          Panier Perdu coûte {price}&nbsp;€ par mois. Avec ton panier moyen de {euros(r.basket)},{" "}
          <strong>
            il est remboursé dès {r.basket >= price ? "la première commande récupérée" : "la deuxième commande récupérée"}
          </strong>
          .
        </p>
      ) : (
        <p className="mt-3 rounded-2xl bg-white/70 p-4 leading-relaxed">
          Franchement : à ton volume actuel, l&apos;estimation ({euros(r.gain)}/mois) ne couvre pas encore les {price}&nbsp;€
          de l&apos;abonnement. Prends quand même la relance gratuite de l&apos;écran suivant et colle-la dans Shopify : elle
          te servira dès aujourd&apos;hui.
        </p>
      )}

      <details className="mt-4 text-sm text-muted">
        <summary className="cursor-pointer py-2 underline underline-offset-4">Comment on calcule</summary>
        <p className="mt-2 leading-relaxed">
          Hypothèses prudentes : {Math.round(HYP.abandonRate * 100)} % des paniers sont abandonnés (moyenne du
          e-commerce), {Math.round(HYP.withEmail * 100)} % des abandons ont laissé un email, et deux relances bien
          espacées en récupèrent {Math.round(HYP.recoveredWithUs * 100)} %. Ta situation actuelle (« {today.label} »)
          est déduite. Ce sont des estimations, pas une promesse.
        </p>
      </details>

      <button
        type="button"
        onClick={onNext}
        className="mt-8 flex h-14 w-full items-center justify-center rounded-full bg-ink text-lg font-semibold text-white active:scale-[0.98] hover:bg-black"
      >
        Voir mes relances, écrites pour moi
      </button>
    </section>
  );
}

function TRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted">{k}</dt>
      <dd className="font-medium whitespace-nowrap">{v}</dd>
    </div>
  );
}

function Preview({ a, ink, setShop, onNext }: { a: Answers; ink: string; setShop: (s: string) => void; onNext: () => void }) {
  const r1 = relance1(a);
  const r2 = relance2(a);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`Objet : ${r1.subject}\n\n${r1.body}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {}
  };

  return (
    <section className="mt-4 sm:mt-10">
      <p className="text-[0.8rem] font-semibold uppercase tracking-[0.2em]" style={{ color: ink }}>
        Ton avant-goût, gratuit
      </p>
      <PosterTitle ink={ink} className="mt-3">
        Ta première relance est prête. Elle est à toi.
      </PosterTitle>

      <label className="mt-6 block">
        <span className="text-sm font-medium">Nom de ta boutique</span>
        <input
          value={a.shop}
          onChange={(e) => setShop(e.target.value.slice(0, 40))}
          placeholder="Ex. : Atelier Lune"
          autoComplete="organization"
          className="mt-1 block h-12 w-full rounded-2xl border-2 border-transparent bg-[#fffdf8] px-4 text-base shadow-[0_10px_24px_-18px_rgba(0,0,0,0.5)] focus:border-ink focus:outline-none"
        />
      </label>

      <EmailCard email={r1} label="Relance 1" />
      <button
        type="button"
        onClick={copy}
        className="mt-3 h-12 w-full rounded-full border-2 border-ink bg-transparent font-semibold text-ink hover:bg-ink hover:text-white"
      >
        {copied ? "Copiée ✓" : "Copier la relance 1"}
      </button>
      <p className="mt-2 text-sm text-muted leading-relaxed">
        À coller dès maintenant dans Shopify : Marketing → Automatisations → « Panier abandonné ».
      </p>

      <div className="relative mt-8" aria-label="Contenu verrouillé">
        <div className="pointer-events-none select-none blur-[5px]" aria-hidden="true">
          <EmailCard email={r2} label="Relance 2" />
          <div className="mt-4 rounded-2xl bg-[#fffdf8] p-4">
            <p className="font-semibold">Les 4 réglages pour {compute(a).orders} commandes/mois</p>
            <ul className="mt-2 list-disc pl-5 text-sm text-muted space-y-1">
              {SETTINGS.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div className="rounded-2xl bg-ink/90 px-5 py-4 text-center text-white shadow-xl">
            <p className="font-semibold">Relance 2 avec code de réduction + 4 réglages</p>
            <p className="text-sm text-white/80">Inclus dans ton plan complet</p>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onNext}
        className="mt-8 flex h-14 w-full items-center justify-center rounded-full bg-ink text-lg font-semibold text-white active:scale-[0.98] hover:bg-black"
      >
        Débloquer mon plan complet
      </button>
    </section>
  );
}

export function EmailCard({ email, label }: { email: { when: string; subject: string; body: string }; label: string }) {
  return (
    <article className="mt-5 overflow-hidden rounded-2xl bg-[#fffdf8] shadow-[0_20px_44px_-28px_rgba(0,0,0,0.5)]">
      <div className="flex items-baseline justify-between gap-3 border-b border-line px-4 py-3">
        <span className="font-semibold">{label}</span>
        <span className="text-right text-xs text-muted">{email.when}</span>
      </div>
      <div className="px-4 py-3">
        <p className="text-sm">
          <span className="text-muted">Objet : </span>
          <span className="font-medium">{email.subject}</span>
        </p>
        <pre className="mt-3 whitespace-pre-wrap font-sans text-[0.95rem] leading-relaxed">
          {email.body.split(/(\{\{[^}]+\}\})/g).map((part, i) =>
            part.startsWith("{{") ? (
              <span key={i} className="rounded bg-[#dfe7f3] px-1 text-[0.85rem] font-medium text-[#0f3550]">
                {part.slice(2, -2)}
              </span>
            ) : (
              part
            ),
          )}
        </pre>
        <p className="mt-3 text-xs text-muted">
          Les mots en bleu sont remplis automatiquement pour chaque client.
        </p>
      </div>
    </article>
  );
}
