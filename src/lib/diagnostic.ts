// Logique partagée (client + serveur) : réponses, calcul, plan de relance.
// Aucune donnée secrète ici : ce fichier est envoyé au navigateur.

import { z } from "zod";

export const ORDERS = [
  { id: "o1", label: "Moins de 20", value: 12 },
  { id: "o2", label: "20 à 50", value: 35 },
  { id: "o3", label: "50 à 100", value: 75 },
  { id: "o4", label: "Plus de 100", value: 140 },
] as const;

export const BASKET = [
  { id: "b1", label: "Moins de 30 €", value: 22 },
  { id: "b2", label: "30 à 60 €", value: 45 },
  { id: "b3", label: "60 à 100 €", value: 80 },
  { id: "b4", label: "Plus de 100 €", value: 130 },
] as const;

export const TODAY = [
  { id: "t1", label: "Rien. Je ne vois même pas qui abandonne.", rate: 0 },
  { id: "t2", label: "Je relance à la main, quand j'y pense.", rate: 0.02 },
  { id: "t3", label: "L'email par défaut de Shopify part tout seul.", rate: 0.05 },
] as const;

// Hypothèses prudentes, affichées en clair à l'utilisateur.
export const HYP = {
  abandonRate: 0.7, // ~7 paniers sur 10 sont abandonnés (moyenne e-commerce)
  withEmail: 0.4, // part des abandons où le client a laissé son email
  recoveredWithUs: 0.09, // part récupérée avec 2 relances bien écrites
};

export const answersSchema = z.object({
  orders: z.enum(["o1", "o2", "o3", "o4"]),
  basket: z.enum(["b1", "b2", "b3", "b4"]),
  today: z.enum(["t1", "t2", "t3"]),
  shop: z
    .string()
    .trim()
    .max(40)
    .regex(/^[\p{L}\p{N} '&.\-]*$/u)
    .default(""),
});
export type Answers = z.infer<typeof answersSchema>;

export function compute(a: Answers) {
  const orders = ORDERS.find((o) => o.id === a.orders)!.value;
  const basket = BASKET.find((b) => b.id === a.basket)!.value;
  const todayRate = TODAY.find((t) => t.id === a.today)!.rate;

  const abandoned = Math.round((orders * HYP.abandonRate) / (1 - HYP.abandonRate));
  const lostEuros = abandoned * basket;
  const reachable = Math.round(abandoned * HYP.withEmail);
  const recoveredToday = Math.round(reachable * todayRate * basket);
  const recoveredWithUs = Math.round(reachable * HYP.recoveredWithUs * basket);
  const gain = Math.max(0, recoveredWithUs - recoveredToday);
  const ordersGained = Math.max(0, Math.round((gain / basket) * 10) / 10);
  return { orders, basket, abandoned, lostEuros, reachable, recoveredToday, recoveredWithUs, gain, ordersGained };
}

export function shopName(a: Pick<Answers, "shop">) {
  return a.shop?.trim() || "ta boutique";
}

export const euros = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

export const euros2 = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: 2 }).format(n);

// --- Le plan livré : deux relances prêtes à coller --------------------------

export type Email = { when: string; subject: string; body: string };

export function relance1(a: Answers): Email {
  const s = a.shop?.trim() || "notre boutique";
  return {
    when: "1 heure après l'abandon",
    subject: "Tu as oublié quelque chose ?",
    body: `Bonjour {{prénom}},

Ton panier t'attend toujours chez ${s}. On l'a mis de côté, tel que tu l'as laissé :

{{articles du panier}}

Une question sur la taille, la livraison ou le paiement ? Réponds simplement à cet email : c'est une vraie personne qui te lit.

→ Reprendre mon panier : {{lien du panier}}

À tout de suite,
L'équipe ${s}`,
  };
}

export function relance2(a: Answers): Email {
  const s = a.shop?.trim() || "notre boutique";
  return {
    when: "24 heures après l'abandon, si toujours pas de commande",
    subject: "Ton panier part bientôt (et un petit coup de pouce)",
    body: `Bonjour {{prénom}},

On ne peut pas garder ton panier indéfiniment : certains articles partent vite.

Pour t'aider à te décider, voici 10 % de réduction, valables 48 heures :

    RETOUR10

→ Finaliser ma commande : {{lien du panier}}

Si ce n'était pas le bon moment, aucun souci : on ne t'écrira plus pour ce panier.

L'équipe ${s}`,
  };
}

export const SETTINGS = [
  "Envoyer la relance 1 une heure après l'abandon, pas avant : le client est peut-être encore en train de comparer.",
  "Envoyer la relance 2 seulement si aucune commande n'a été passée entre-temps.",
  "Réserver le code de réduction à la relance 2 : la moitié des clients reviennent sans.",
  "Limiter le code à 48 heures et à un usage par client.",
];

// --- Formules -----------------------------------------------------------------

export const PLANS = {
  mensuel: { id: "mensuel", name: "Mensuel", cents: 3900, interval: "month", note: "Le plus souple" },
  fondateur: {
    id: "fondateur",
    name: "Fondateur",
    cents: 2900,
    interval: "month",
    note: "Réservé aux 20 premières boutiques, prix gardé à vie",
  },
  annuel: { id: "annuel", name: "Annuel", cents: 39000, interval: "year", note: "2 mois offerts" },
} as const;
export type PlanId = keyof typeof PLANS;
export const PLAN_ORDER: PlanId[] = ["mensuel", "fondateur", "annuel"];

export function perDay(id: PlanId) {
  const p = PLANS[id];
  const days = p.interval === "year" ? 365 : 30;
  return p.cents / 100 / days;
}

export const GUARANTEE = {
  days: 30,
  refundDays: 7,
  how: "un email à l'adresse du pied de page, sans justification",
};

export const LAUNCH_DATE_LABEL = "sous 21 jours";
