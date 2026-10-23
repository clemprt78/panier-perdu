import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { DashboardView, type Cart } from "@/app/app/page";
import { relance1, relance2, type Answers } from "@/lib/diagnostic";

export const metadata: Metadata = {
  title: "Démo de l'espace client",
  description: "Un exemple d'espace client Panier Perdu, avec une boutique et des clients fictifs.",
};

// Boutique et clients fictifs, pour montrer l'espace client aux prospects.
const ANSWERS: Answers = { orders: "o2", basket: "b2", today: "t1", shop: "Atelier Brume" };

const PEOPLE = [
  "Julie", "Thomas", "Camille", "Lucas", "Sarah", "Hugo", "Léa", "Antoine", "Manon", "Nicolas",
  "Chloé", "Maxime", "Inès", "Julien", "Emma", "Romain", "Clara", "Mathieu", "Anaïs", "Pierre",
  "Lucie", "Kévin", "Pauline", "Alexandre", "Marion", "Benjamin", "Elodie", "Florian", "Laura", "Quentin",
  "Margaux", "Adrien", "Océane", "Damien", "Justine", "Victor", "Charlotte", "Arthur",
];
const LETTERS = "mbdlrpgfcvt";
const DOMAINS = ["gmail.com", "orange.fr", "hotmail.fr", "free.fr", "gmail.com", "outlook.fr", "gmail.com", "laposte.net"];

// Générateur pseudo-aléatoire fixe : les mêmes chiffres à chaque visite.
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

function demoData() {
  const now = Date.now();
  const rand = rng(42);
  const H = 3600 * 1000;
  const carts: Cart[] = PEOPLE.map((name, i) => {
    // Abandons répartis sur 30 jours, plus nombreux récemment
    const ageH = Math.round(Math.pow(i / PEOPLE.length, 1.15) * 29 * 24 + rand() * 10 + 0.4);
    const at = now - ageH * H;
    const cents = Math.round((24 + rand() * 96) * 100) - 10;
    const local = `${name.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase()}.${LETTERS[i % LETTERS.length]}`;
    const email = `${local}***@${DOMAINS[i % DOMAINS.length]}`;
    const r1 = ageH >= 1 ? new Date(at + H).toISOString() : null;
    const r2 = ageH >= 25 ? new Date(at + 25 * H).toISOString() : null;
    let status = ageH < 1 ? "pending" : ageH < 25 ? "relance1_sent" : "relance2_sent";
    let recovered_at: string | null = null;
    let recovered_cents: number | null = null;
    // Environ 1 panier relancé sur 8 revient payer
    if (ageH >= 3 && i % 8 === 2) {
      const after = (ageH >= 30 ? 26 + rand() * 20 : 1.5 + rand() * 6) * H;
      status = "recovered";
      recovered_at = new Date(at + Math.min(after, (ageH - 0.5) * H)).toISOString();
      recovered_cents = Math.round(cents * (ageH >= 30 ? 0.9 : 1));
    } else if (ageH > 7 * 24 + 25) {
      status = "stopped";
    }
    return {
      id: `demo-${i}`,
      email,
      first_name: name,
      total_cents: cents,
      currency: "EUR",
      abandoned_at: new Date(at).toISOString(),
      status,
      relance1_sent_at: r1,
      relance2_sent_at: status === "recovered" && recovered_at && r2 && recovered_at < r2 ? null : r2,
      recovered_cents,
      recovered_at,
    };
  });

  // Sur 30 jours glissants, pour que la démo ne retombe jamais à 0 en début de mois
  const recoveredMonth = carts.reduce((sum, c) => sum + (c.recovered_cents ?? 0), 0) / 100;

  const dayKey = (d: Date) => new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris" }).format(d);
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(now - (13 - i) * 24 * H);
    return { key: dayKey(d), label: new Intl.DateTimeFormat("fr-FR", { day: "numeric", timeZone: "Europe/Paris" }).format(d), ab: 0, rec: 0 };
  });
  return { carts, recoveredMonth, days, lastSync: new Date(now - 3 * 60 * 1000).toISOString() };
}

export default function DemoPage() {
  return (
    <Suspense fallback={<main className="grid min-h-dvh place-items-center bg-paper text-muted">Chargement…</main>}>
      <Demo />
    </Suspense>
  );
}

async function Demo() {
  await connection(); // les dates sont calculées à chaque visite
  const { carts, recoveredMonth, days, lastSync } = demoData();
  const r1 = relance1(ANSWERS);
  const r2 = relance2(ANSWERS);
  return (
    <DashboardView
      demo
      email="contact@atelier-brume.fr"
      owner={false}
      msg={null}
      sub={{ plan: "fondateur", status: "active" }}
      shop={{
        name: "Atelier Brume",
        shopify_domain: "atelier-brume.myshopify.com",
        last_synced_at: lastSync,
        relance1_subject: r1.subject,
        relance1_body: r1.body,
        relance1_delay_minutes: 60,
        relance2_subject: r2.subject,
        relance2_body: r2.body,
        relance2_delay_hours: 24,
        discount_enabled: true,
        discount_percent: 10,
      }}
      carts={carts}
      recoveredMonth={recoveredMonth}
      currency="EUR"
      days={days}
    />
  );
}
