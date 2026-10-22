import "server-only";
import { relance1, relance2, type Answers, type PlanId } from "@/lib/diagnostic";
import { loginLinkFor, supabaseAdmin } from "@/lib/server/supabase";

// Après un paiement confirmé : compte, abonnement et boutique pré-remplie.
// Rejouable sans risque (Stripe peut renvoyer le même événement).
export async function provisionCustomer(input: {
  email: string;
  answers: Answers;
  plan: PlanId;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
}) {
  const login = await loginLinkFor(input.email, true);
  if (!login) throw new Error("Impossible de créer le compte");
  const db = supabaseAdmin();

  const { error: subErr } = await db.from("subscriptions").upsert(
    {
      user_id: login.userId,
      plan: input.plan,
      status: "active",
      stripe_customer_id: input.stripeCustomerId,
      stripe_subscription_id: input.stripeSubscriptionId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "stripe_subscription_id" },
  );
  if (subErr) throw subErr;

  const { count } = await db.from("shops").select("id", { count: "exact", head: true }).eq("user_id", login.userId);
  if (!count) {
    const r1 = relance1(input.answers);
    const r2 = relance2(input.answers);
    const { error: shopErr } = await db.from("shops").insert({
      user_id: login.userId,
      name: input.answers.shop,
      relance1_subject: r1.subject,
      relance1_body: r1.body,
      relance2_subject: r2.subject,
      relance2_body: r2.body,
    });
    if (shopErr) throw shopErr;
  }

  return login.link;
}

export async function updateSubscriptionStatus(stripeSubscriptionId: string, status: string, periodEnd: number | null) {
  const { error } = await supabaseAdmin()
    .from("subscriptions")
    .update({
      status,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", stripeSubscriptionId);
  if (error) throw error;
}
