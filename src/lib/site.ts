// Réglages publics du site. Les valeurs entre crochets sont à compléter.
export const SITE = {
  name: "Panier Perdu",
  // La phrase des vidéos : à reprendre mot pour mot dans TikTok / Reels / Shorts.
  promise: "Récupère les paniers abandonnés de ta boutique.",
  description:
    "Deux relances bien écrites, envoyées au bon moment, et le chiffre d'affaires récupéré affiché en euros. Pensé pour les boutiques Shopify qui font quelques dizaines de commandes par mois.",
  url:
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000"),
  contact: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "[email de contact à compléter]",
};
