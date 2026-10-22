import "server-only";
import type Stripe from "stripe";
import { answersSchema, type Answers, type PlanId, PLANS } from "@/lib/diagnostic";

// Relit les réponses stockées dans la session Stripe (et les revalide).
export function answersFromSession(session: Stripe.Checkout.Session): { answers: Answers; plan: PlanId } | null {
  const m = session.metadata ?? {};
  const parsed = answersSchema.safeParse({ orders: m.orders, basket: m.basket, today: m.today, shop: m.shop ?? "" });
  const plan = m.plan as PlanId;
  if (!parsed.success || !(plan in PLANS)) return null;
  return { answers: parsed.data, plan };
}

// Un paiement est confirmé seulement si Stripe le dit, côté serveur.
export function isPaid(session: Stripe.Checkout.Session) {
  return session.status === "complete" && (session.payment_status === "paid" || session.payment_status === "no_payment_required");
}
