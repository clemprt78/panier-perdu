"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { relance1, relance2 } from "@/lib/diagnostic";
import { loginEmailHtml, sendEmail } from "@/lib/server/email";
import { requireOwner } from "@/lib/server/owner";
import { loginLinkFor, supabaseAdmin } from "@/lib/server/supabase";

export type AdminState = { ok?: string; error?: string };

const manualSchema = z.object({
  email: z.email().max(200),
  shop: z.string().trim().max(40).regex(/^[\p{L}\p{N} '&.\-]*$/u),
  plan: z.enum(["mensuel", "fondateur", "annuel"]),
  sendLink: z.boolean(),
});

// Vente à la main : compte + abonnement + boutique pré-remplie, sans passer par Stripe.
export async function createManualCustomer(_: AdminState, form: FormData): Promise<AdminState> {
  if (!(await requireOwner())) return { error: "Accès refusé." };
  const parsed = manualSchema.safeParse({
    email: String(form.get("email") ?? "").trim().toLowerCase(),
    shop: form.get("shop") ?? "",
    plan: form.get("plan"),
    sendLink: form.get("sendLink") === "on",
  });
  if (!parsed.success) return { error: "Vérifie l'email et le nom de boutique." };
  const { email, shop, plan, sendLink } = parsed.data;

  const login = await loginLinkFor(email, true);
  if (!login) return { error: "Impossible de créer le compte." };
  const db = supabaseAdmin();

  const { error: subErr } = await db
    .from("subscriptions")
    .insert({ user_id: login.userId, plan, status: "active", source: "manuel" });
  if (subErr) return { error: "Abonnement non créé : " + subErr.message };

  const { count } = await db.from("shops").select("id", { count: "exact", head: true }).eq("user_id", login.userId);
  if (!count) {
    const a = { orders: "o2", basket: "b2", today: "t1", shop } as const;
    const r1 = relance1(a);
    const r2 = relance2(a);
    await db.from("shops").insert({
      user_id: login.userId,
      name: shop,
      relance1_subject: r1.subject,
      relance1_body: r1.body,
      relance2_subject: r2.subject,
      relance2_body: r2.body,
    });
  }

  if (sendLink) await sendEmail(email, "Ton accès Panier Perdu", loginEmailHtml(login.link));
  revalidatePath("/app/admin");
  return { ok: `Client ${email} créé${sendLink ? ", lien de connexion envoyé" : ""}.` };
}

const appSchema = z.object({
  email: z.email().max(200),
  clientId: z.string().trim().min(10).max(100).regex(/^[A-Za-z0-9_-]+$/),
  clientSecret: z.string().trim().min(10).max(200).regex(/^[A-Za-z0-9_-]+$/),
});

// Enregistre l'application Shopify dédiée à un client (distribution personnalisée).
export async function registerShopifyApp(_: AdminState, form: FormData): Promise<AdminState> {
  if (!(await requireOwner())) return { error: "Accès refusé." };
  const parsed = appSchema.safeParse({
    email: String(form.get("email") ?? "").trim().toLowerCase(),
    clientId: form.get("clientId"),
    clientSecret: form.get("clientSecret"),
  });
  if (!parsed.success) return { error: "Vérifie l'email, le Client ID et le Secret." };

  const db = supabaseAdmin();
  const login = await loginLinkFor(parsed.data.email, false);
  if (!login) return { error: "Aucun client avec cet email. Crée-le d'abord." };

  const { error } = await db.from("shopify_apps").insert({
    label: parsed.data.email,
    client_id: parsed.data.clientId,
    client_secret: parsed.data.clientSecret,
    user_id: login.userId,
  });
  if (error) return { error: error.code === "23505" ? "Ce Client ID est déjà enregistré." : error.message };
  revalidatePath("/app/admin");
  return { ok: "Application enregistrée. Ses deux adresses sont dans la liste ci-dessous." };
}
