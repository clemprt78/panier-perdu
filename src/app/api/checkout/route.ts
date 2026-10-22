import { z } from "zod";
import { PLANS, answersSchema, compute } from "@/lib/diagnostic";
import { SITE } from "@/lib/site";
import { stripe } from "@/lib/server/stripe";

const bodySchema = z.object({
  plan: z.enum(["mensuel", "fondateur", "annuel"]),
  answers: answersSchema,
});

export async function POST(request: Request) {
  // 1. Validation serveur de tout ce qui vient du navigateur
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Réponses invalides. Recharge la page et recommence." }, { status: 400 });
  }
  const { plan, answers } = parsed.data;
  const p = PLANS[plan]; // le prix vient du serveur, jamais du navigateur

  const origin = new URL(request.url).origin || SITE.url;

  try {
    const session = await stripe().checkout.sessions.create({
      ui_mode: "embedded_page",
      mode: "subscription",
      locale: "fr",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: p.cents,
            recurring: { interval: p.interval },
            product_data: { name: `Panier Perdu — ${p.name}` },
          },
        },
      ],
      metadata: {
        plan,
        orders: answers.orders,
        basket: answers.basket,
        today: answers.today,
        shop: answers.shop,
        gain: String(compute(answers).gain),
      },
      subscription_data: { metadata: { plan, shop: answers.shop } },
      return_url: `${origin}/merci?session_id={CHECKOUT_SESSION_ID}`,
    });
    return Response.json({ clientSecret: session.client_secret });
  } catch (e) {
    console.error("checkout", e);
    return Response.json({ error: "Le paiement est indisponible pour le moment." }, { status: 500 });
  }
}
