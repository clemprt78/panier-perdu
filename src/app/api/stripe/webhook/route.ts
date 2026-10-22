import type Stripe from "stripe";
import { stripe } from "@/lib/server/stripe";
import { answersFromSession, isPaid } from "@/lib/server/delivery";
import { planEmailHtml, sendEmail } from "@/lib/server/email";
import { provisionCustomer, updateSubscriptionStatus } from "@/lib/server/provision";
import { supabaseConfigured } from "@/lib/server/supabase";
import { PLANS, compute, euros } from "@/lib/diagnostic";

const idOf = (v: string | { id: string } | null) => (typeof v === "string" ? v : (v?.id ?? null));

// Stripe appelle cette adresse à chaque événement. On vérifie la signature :
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

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const data = answersFromSession(session);
      const email = session.customer_details?.email?.toLowerCase();

      if (isPaid(session) && data && email) {
        // 1. Compte + abonnement + boutique pré-remplie (si Supabase est branché)
        let loginLink: string | undefined;
        if (supabaseConfigured()) {
          loginLink = await provisionCustomer({
            email,
            answers: data.answers,
            plan: data.plan,
            stripeCustomerId: idOf(session.customer),
            stripeSubscriptionId: idOf(session.subscription),
          });
        }

        // 2. Livraison du plan + lien vers l'espace client
        await sendEmail(email, "Ton plan Panier Perdu est prêt", planEmailHtml(data.answers, data.plan, loginLink));

        // 3. Alerte au vendeur
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

    if (
      (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") &&
      supabaseConfigured()
    ) {
      const sub = event.data.object as Stripe.Subscription;
      const status = event.type === "customer.subscription.deleted" ? "canceled" : sub.status;
      await updateSubscriptionStatus(sub.id, status, sub.items.data[0]?.current_period_end ?? null);
    }
  } catch (e) {
    // Réponse 500 : Stripe réessaiera automatiquement plus tard.
    console.error("webhook", event.type, e);
    return new Response("Erreur de traitement", { status: 500 });
  }

  return new Response("ok");
}
