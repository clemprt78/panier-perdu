import "server-only";
import { randomBytes } from "node:crypto";
import { Resend } from "resend";
import { SITE } from "@/lib/site";
import { createDiscountCode, findOrderSince, syncAbandonedCheckouts } from "@/lib/server/shopify";
import { supabaseAdmin } from "@/lib/server/supabase";

const HOUR = 3600 * 1000;
const RECOVERY_WINDOW = 7 * 24 * HOUR; // une commande compte comme récupérée jusqu'à 7 jours après la relance 1
const MAX_AGE_FOR_FIRST = 48 * HOUR; // on ne relance pas un panier découvert trop tard

type Shop = {
  id: string;
  user_id: string;
  name: string;
  shopify_domain: string;
  relance1_subject: string;
  relance1_body: string;
  relance1_delay_minutes: number;
  relance2_subject: string;
  relance2_body: string;
  relance2_delay_hours: number;
  discount_enabled: boolean;
  discount_percent: number;
  test_mode: boolean;
};

type Checkout = {
  id: string;
  email: string;
  first_name: string | null;
  items: string | null;
  recovery_url: string | null;
  abandoned_at: string;
  status: "pending" | "relance1_sent" | "relance2_sent";
  relance1_sent_at: string | null;
};

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

// « CLEMENT » ou « clement » → « Clement »
const nice = (n: string | null) => {
  const t = n?.trim();
  if (!t) return null;
  return t === t.toUpperCase() || t === t.toLowerCase()
    ? t.toLowerCase().replace(/(^|[\s-])\p{L}/gu, (m) => m.toUpperCase())
    : t;
};

function fill(template: string, raw: Checkout, code: string | null) {
  const c = { ...raw, first_name: nice(raw.first_name) };
  let t = template
    .replaceAll("Bonjour {{prénom}},", c.first_name ? `Bonjour ${c.first_name},` : "Bonjour,")
    .replaceAll("{{prénom}}", c.first_name ?? "")
    .replaceAll("{{articles du panier}}", c.items ?? "")
    .replaceAll("{{lien du panier}}", c.recovery_url ?? "");
  if (code) t = t.replaceAll("RETOUR10", code).replaceAll("{{code}}", code);
  return t;
}

function toHtml(text: string, shopName: string, cartUrl: string | null, unsubscribeUrl: string) {
  // Le texte reste celui du marchand ; la ligne qui contient le lien brut devient un bouton.
  const button = cartUrl
    ? `<p style="margin:20px 0"><a href="${esc(cartUrl)}" style="display:inline-block;background:#1b1d1a;color:#fff;text-decoration:none;font-weight:600;padding:13px 20px;border-radius:8px">Reprendre mon panier</a></p>`
    : "";
  const parts = text.split("\n").map((l) => (cartUrl && l.includes(cartUrl) ? "§BUTTON§" : l));
  const html = esc(parts.join("\n"))
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\n/g, "<br>")
    .replace(/(<br>)*§BUTTON§(<br>)*/g, button);
  return `<div style="max-width:560px;margin:0 auto;font:15px/1.6 -apple-system,system-ui,sans-serif;color:#1b1d1a;padding:8px">
${html}
<p style="margin-top:32px;font-size:12px;color:#8a8d85">Tu reçois ce message car tu as commencé une commande chez ${esc(shopName)}.
<a href="${esc(unsubscribeUrl)}" style="color:#8a8d85">Ne plus recevoir ces messages</a>.</p>
</div>`;
}

function fromName(name: string) {
  const clean = name.replace(/[<>"@,;:\\]/g, "").trim().slice(0, 40);
  return clean || "Ta boutique";
}

async function send(shop: Shop, ownerEmail: string | null, c: Checkout, subject: string, text: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY manquante");
  const domain = process.env.RELANCE_FROM_DOMAIN || "panier-perdu.com";
  const unsubscribe = `${SITE.url}/desinscription/${c.id}`;
  const { error } = await new Resend(key).emails.send({
    from: `${fromName(shop.name)} <relance@${domain}>`,
    to: c.email,
    replyTo: ownerEmail ?? undefined,
    subject,
    text: `${text}\n\n—\nNe plus recevoir ces messages : ${unsubscribe}`,
    html: toHtml(text, shop.name || "cette boutique", c.recovery_url, unsubscribe),
    headers: {
      "List-Unsubscribe": `<${SITE.url}/api/desinscription/${c.id}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  });
  if (error) throw new Error(`Resend : ${error.message}`);
}

// Réserve le panier pour un envoi : si deux réveils tombent en même temps, un seul gagne.
async function claim(id: string, from: Checkout["status"], to: Checkout["status"], field: string) {
  const { data } = await supabaseAdmin()
    .from("checkouts")
    .update({ status: to, [field]: new Date().toISOString() })
    .eq("id", id)
    .eq("status", from)
    .select("id");
  return Boolean(data?.length);
}

async function release(id: string, status: Checkout["status"], field: string) {
  await supabaseAdmin().from("checkouts").update({ status, [field]: null }).eq("id", id);
}

export async function processShop(shop: Shop, token: string, ownerEmail: string | null) {
  const db = supabaseAdmin();
  const now = Date.now();
  const delay1 = shop.test_mode ? 2 * 60 * 1000 : shop.relance1_delay_minutes * 60 * 1000;
  const delay2 = shop.test_mode ? 5 * 60 * 1000 : shop.relance2_delay_hours * HOUR;
  const log = { relance1: 0, relance2: 0, recovered: 0, stopped: 0, errors: 0 };

  const [{ data: rows }, { data: unsubs }] = await Promise.all([
    db
      .from("checkouts")
      .select("id,email,first_name,items,recovery_url,abandoned_at,status,relance1_sent_at")
      .eq("shop_id", shop.id)
      .in("status", ["pending", "relance1_sent", "relance2_sent"])
      .order("abandoned_at")
      .limit(200),
    db.from("unsubscribes").select("email").eq("shop_id", shop.id),
  ]);
  const unsubscribed = new Set((unsubs ?? []).map((u) => u.email));

  for (const c of (rows ?? []) as Checkout[]) {
    try {
      const age = now - new Date(c.abandoned_at).getTime();

      if (unsubscribed.has(c.email)) {
        await db.from("checkouts").update({ status: "stopped" }).eq("id", c.id);
        log.stopped++;
        continue;
      }

      if (c.status === "pending") {
        if (age < delay1) continue;
        if (!shop.test_mode && age > MAX_AGE_FOR_FIRST) {
          await db.from("checkouts").update({ status: "stopped" }).eq("id", c.id);
          log.stopped++;
          continue;
        }
        // Déjà commandé ? Alors pas de relance, et ce n'est pas une récupération.
        if (await findOrderSince(shop.shopify_domain, token, c.email, c.abandoned_at)) {
          await db.from("checkouts").update({ status: "stopped" }).eq("id", c.id);
          log.stopped++;
          continue;
        }
        if (!(await claim(c.id, "pending", "relance1_sent", "relance1_sent_at"))) continue;
        try {
          await send(shop, ownerEmail, c, shop.relance1_subject, fill(shop.relance1_body, c, null));
          log.relance1++;
        } catch (e) {
          await release(c.id, "pending", "relance1_sent_at");
          throw e;
        }
        continue;
      }

      // Après une relance : le client a-t-il commandé ?
      const relancedAt = new Date(c.relance1_sent_at ?? c.abandoned_at).getTime();
      const order = await findOrderSince(shop.shopify_domain, token, c.email, new Date(relancedAt).toISOString());
      if (order && new Date(order.createdAt).getTime() - relancedAt <= RECOVERY_WINDOW) {
        await db
          .from("checkouts")
          .update({
            status: "recovered",
            recovered_order_id: order.id,
            recovered_cents: order.cents,
            recovered_at: order.createdAt,
          })
          .eq("id", c.id);
        log.recovered++;
        continue;
      }

      if (now - relancedAt > RECOVERY_WINDOW) {
        await db.from("checkouts").update({ status: "stopped" }).eq("id", c.id);
        log.stopped++;
        continue;
      }

      if (c.status === "relance1_sent" && age >= delay2) {
        if (!(await claim(c.id, "relance1_sent", "relance2_sent", "relance2_sent_at"))) continue;
        try {
          let code: string | null = null;
          if (shop.discount_enabled) {
            code = `RETOUR-${randomBytes(3).toString("hex").toUpperCase()}`;
            await createDiscountCode(shop.shopify_domain, token, code, shop.discount_percent, 48);
            await db.from("checkouts").update({ discount_code: code }).eq("id", c.id);
          }
          await send(shop, ownerEmail, c, shop.relance2_subject, fill(shop.relance2_body, c, code));
          log.relance2++;
        } catch (e) {
          await release(c.id, "relance1_sent", "relance2_sent_at");
          throw e;
        }
      }
    } catch (e) {
      log.errors++;
      console.error("relance", shop.shopify_domain, c.id, e);
    }
  }
  return log;
}

// Un tour complet : chaque boutique branchée dont l'abonnement est actif.
export async function runAll() {
  const db = supabaseAdmin();
  const { data: shops } = await db.from("shops").select("*").not("shopify_domain", "is", null);
  const results: Record<string, unknown> = {};

  for (const shop of (shops ?? []) as Shop[]) {
    try {
      const { data: sub } = await db
        .from("subscriptions")
        .select("status")
        .eq("user_id", shop.user_id)
        .in("status", ["active", "trialing"])
        .limit(1);
      if (!sub?.length) {
        results[shop.shopify_domain] = "abonnement inactif";
        continue;
      }
      const { data: secret } = await db
        .from("shop_secrets")
        .select("shopify_access_token")
        .eq("shop_id", shop.id)
        .single();
      if (!secret) continue;

      await syncAbandonedCheckouts(shop.id);
      const { data: owner } = await db.auth.admin.getUserById(shop.user_id);
      results[shop.shopify_domain] = await processShop(shop, secret.shopify_access_token, owner.user?.email ?? null);
    } catch (e) {
      console.error("shop", shop.shopify_domain, e);
      results[shop.shopify_domain] = "erreur";
    }
  }
  return results;
}
