import type Stripe from "stripe";
import { stripe } from "@/lib/server/stripe";
import { answersFromSession, isPaid } from "@/lib/server/delivery";
import { planEmailHtml, sendEmail } from "@/lib/server/email";
import { PLANS, compute, euros } from "@/lib/diagnostic";

// Stripe appelle cette adresse à chaque paiement. On vérifie la signature :
// seul Stripe peut déclencher la livraison.
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");
  if (!secret || !signature) return new Response("Configuration manquante", { status: 400 });

  const raw = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(raw, signature, secret);
  } catch {
    return new Response("Signature invalide", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const data = answersFromSession(session);
    const email = session.customer_details?.email;

    if (isPaid(session) && data && email) {
      await sendEmail(email, "Ton plan Panier Perdu est prêt", planEmailHtml(data.answers, data.plan));

      const owner = process.env.OWNER_EMAIL;
      if (owner) {
        const r = compute(data.answers);
        await sendEmail(
          owner,
          `Nouvelle vente : ${PLANS[data.plan].name}`,
          `<p>Nouveau client : <b>${email}</b></p>
<p>Formule : ${PLANS[data.plan].name}<br>Boutique : ${data.answers.shop || "(non renseignée)"}<br>
Commandes/mois ≈ ${r.orders} · panier moyen ≈ ${euros(r.basket)} · gain estimé +${euros(r.gain)}/mois</p>
<p>À faire : lui écrire pour brancher sa boutique.</p>`,
        );
      }
    }
  }

  return new Response("ok");
}
