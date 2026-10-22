import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { supabaseAdmin } from "@/lib/server/supabase";

export const SHOPIFY_API_VERSION = "2026-10";
// Lire les paniers et commandes, lire l'email du client, créer les codes de réduction.
export const SHOPIFY_SCOPES = "read_orders,read_customers,write_discounts";

const SHOP_RE = /^[a-z0-9][a-z0-9-]{0,60}\.myshopify\.com$/;
export const validShop = (s: string | null): s is string => !!s && SHOP_RE.test(s);

export type ShopifyApp = { id: string; client_id: string; client_secret: string; user_id: string | null; label: string };

export async function getApp(appId: string): Promise<ShopifyApp | null> {
  if (!/^[0-9a-f-]{36}$/.test(appId)) return null;
  const { data } = await supabaseAdmin().from("shopify_apps").select("*").eq("id", appId).maybeSingle();
  return data;
}

// Vérifie que la requête vient bien de Shopify (signature HMAC des paramètres).
export function verifyShopifyHmac(params: URLSearchParams, secret: string) {
  const hmac = params.get("hmac");
  if (!hmac) return false;
  const message = [...params.entries()]
    .filter(([k]) => k !== "hmac" && k !== "signature")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");
  const digest = createHmac("sha256", secret).update(message).digest("hex");
  const a = Buffer.from(digest, "utf8");
  const b = Buffer.from(hmac, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function exchangeCode(shop: string, app: ShopifyApp, code: string) {
  const res = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ client_id: app.client_id, client_secret: app.client_secret, code }),
  });
  if (!res.ok) throw new Error(`Échange du code Shopify refusé (${res.status})`);
  return (await res.json()) as {
    access_token: string;
    scope: string;
    expires_in?: number;
    refresh_token?: string;
  };
}

export async function shopifyGraphql<T>(shop: string, token: string, query: string, variables?: Record<string, unknown>) {
  const res = await fetch(`https://${shop}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": token },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });
  const json = (await res.json().catch(() => ({}))) as { data?: T; errors?: unknown };
  if (!res.ok || json.errors) {
    throw new Error(`Shopify GraphQL ${res.status} : ${JSON.stringify(json.errors ?? json).slice(0, 500)}`);
  }
  return json.data as T;
}

type AbandonedNode = {
  id: string;
  createdAt: string;
  completedAt: string | null;
  abandonedCheckoutUrl: string;
  customer: { email: string | null; firstName: string | null } | null;
  totalPriceSet: { shopMoney: { amount: string; currencyCode: string } };
  lineItems: { nodes: { title: string; quantity: number }[] };
};

const ABANDONED_QUERY = `
query Abandoned($q: String!, $after: String) {
  abandonedCheckouts(first: 50, after: $after, query: $q, reverse: true) {
    pageInfo { hasNextPage endCursor }
    nodes {
      id
      createdAt
      completedAt
      abandonedCheckoutUrl
      customer { email firstName }
      totalPriceSet { shopMoney { amount currencyCode } }
      lineItems(first: 5) { nodes { title quantity } }
    }
  }
}`;

// Lit les paniers abandonnés des 14 derniers jours et les range dans la base.
// Ne touche jamais au suivi des relances déjà enregistré.
export async function syncAbandonedCheckouts(shopId: string) {
  const db = supabaseAdmin();
  const { data: shop } = await db.from("shops").select("id, shopify_domain").eq("id", shopId).single();
  const { data: secret } = await db.from("shop_secrets").select("shopify_access_token").eq("shop_id", shopId).single();
  if (!shop?.shopify_domain || !secret) throw new Error("Boutique non branchée");
  await fillShopName(shop.id, shop.shopify_domain, secret.shopify_access_token).catch((e) =>
    console.error("shop name", e),
  );

  const since = new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString();
  const q = `created_at:>='${since}'`;
  const rows: Record<string, unknown>[] = [];
  const completed: string[] = [];
  let after: string | null = null;

  for (let page = 0; page < 10; page++) {
    const data: { abandonedCheckouts: { pageInfo: { hasNextPage: boolean; endCursor: string }; nodes: AbandonedNode[] } } =
      await shopifyGraphql(shop.shopify_domain, secret.shopify_access_token, ABANDONED_QUERY, { q, after });
    for (const n of data.abandonedCheckouts.nodes) {
      if (n.completedAt) {
        completed.push(n.id);
        continue;
      }
      const email = n.customer?.email?.trim().toLowerCase();
      if (!email) continue; // impossible à relancer sans email
      rows.push({
        shop_id: shop.id,
        shopify_checkout_id: n.id,
        email,
        first_name: n.customer?.firstName ?? null,
        total_cents: Math.round(Number(n.totalPriceSet.shopMoney.amount) * 100),
        currency: n.totalPriceSet.shopMoney.currencyCode,
        recovery_url: n.abandonedCheckoutUrl,
        abandoned_at: n.createdAt,
        items: n.lineItems.nodes.map((l) => `${l.quantity} × ${l.title}`).join("\n").slice(0, 1000) || null,
      });
    }
    if (!data.abandonedCheckouts.pageInfo.hasNextPage) break;
    after = data.abandonedCheckouts.pageInfo.endCursor;
  }

  if (rows.length) {
    const { error } = await db
      .from("checkouts")
      .upsert(rows, { onConflict: "shop_id,shopify_checkout_id", ignoreDuplicates: true });
    if (error) throw error;
  }
  // Payé sans aucune relance : on arrête le suivi (et on ne le compte pas comme récupéré).
  if (completed.length) {
    await db
      .from("checkouts")
      .update({ status: "stopped" })
      .eq("shop_id", shop.id)
      .eq("status", "pending")
      .in("shopify_checkout_id", completed);
  }
  await db.from("shops").update({ last_synced_at: new Date().toISOString() }).eq("id", shop.id);
  return { found: rows.length };
}

// Si le client n'a pas donné le nom de sa boutique, on prend celui de Shopify
// et on remplace la formule générique « notre boutique » dans ses relances.
export async function fillShopName(shopId: string, domain: string, token: string) {
  const db = supabaseAdmin();
  const { data: row } = await db
    .from("shops")
    .select("name,relance1_body,relance2_body")
    .eq("id", shopId)
    .single();
  if (!row || row.name) return;
  const data = await shopifyGraphql<{ shop: { name: string } }>(domain, token, `{ shop { name } }`);
  const name = data.shop.name.trim().slice(0, 40);
  if (!name) return;
  const swap = (t: string) => t.replaceAll("notre boutique", name);
  await db
    .from("shops")
    .update({ name, relance1_body: swap(row.relance1_body), relance2_body: swap(row.relance2_body) })
    .eq("id", shopId);
}

// Le client a-t-il passé commande depuis cette date ? (relance inutile, ou panier récupéré)
export async function findOrderSince(domain: string, token: string, email: string, sinceIso: string) {
  const safeEmail = email.replace(/["\\\s]/g, "");
  const data = await shopifyGraphql<{
    orders: { nodes: { id: string; createdAt: string; totalPriceSet: { shopMoney: { amount: string } } }[] };
  }>(
    domain,
    token,
    `query O($q: String!) { orders(first: 1, query: $q, sortKey: CREATED_AT) { nodes { id createdAt totalPriceSet { shopMoney { amount } } } } }`,
    { q: `email:"${safeEmail}" created_at:>='${sinceIso}'` },
  );
  const o = data.orders.nodes[0];
  return o ? { id: o.id, createdAt: o.createdAt, cents: Math.round(Number(o.totalPriceSet.shopMoney.amount) * 100) } : null;
}

// Crée un code de réduction à usage unique, valable quelques heures.
export async function createDiscountCode(domain: string, token: string, code: string, percent: number, hours: number) {
  const now = new Date();
  const base = {
    title: `Panier Perdu – ${code}`,
    code,
    startsAt: now.toISOString(),
    endsAt: new Date(now.getTime() + hours * 3600 * 1000).toISOString(),
    customerGets: { value: { percentage: percent / 100 }, items: { all: true } },
    appliesOncePerCustomer: true,
    usageLimit: 1,
  };
  const mutation = `mutation C($d: DiscountCodeBasicInput!) {
    discountCodeBasicCreate(basicCodeDiscount: $d) { codeDiscountNode { id } userErrors { field message } }
  }`;
  type R = { discountCodeBasicCreate: { codeDiscountNode: { id: string } | null; userErrors: { message: string }[] } };
  try {
    const r = await shopifyGraphql<R>(domain, token, mutation, { d: { ...base, customerSelection: { all: true } } });
    if (r.discountCodeBasicCreate.codeDiscountNode) return code;
    throw new Error(JSON.stringify(r.discountCodeBasicCreate.userErrors));
  } catch (first) {
    // Versions récentes de l'API : « context » remplace « customerSelection ».
    const r = await shopifyGraphql<R>(domain, token, mutation, { d: { ...base, context: { all: "ALL" } } });
    if (r.discountCodeBasicCreate.codeDiscountNode) return code;
    throw new Error(`Code non créé : ${String(first)} / ${JSON.stringify(r.discountCodeBasicCreate.userErrors)}`);
  }
}
