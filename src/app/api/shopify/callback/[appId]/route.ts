import { NextResponse, type NextRequest } from "next/server";
import { exchangeCode, getApp, syncAbandonedCheckouts, validShop, verifyShopifyHmac } from "@/lib/server/shopify";
import { supabaseAdmin, supabaseUser } from "@/lib/server/supabase";
import { relance1, relance2 } from "@/lib/diagnostic";

// Shopify renvoie ici le marchand après son accord : on récupère le jeton
// et on rattache la boutique au bon client Panier Perdu.
export async function GET(request: NextRequest, ctx: RouteContext<"/api/shopify/callback/[appId]">) {
  const { appId } = await ctx.params;
  const params = request.nextUrl.searchParams;
  const shop = params.get("shop");
  const code = params.get("code");
  const state = params.get("state");
  const fail = (reason: string) => NextResponse.redirect(new URL(`/app?shopify=${reason}`, request.url));

  const app = await getApp(appId);
  if (!app || !validShop(shop) || !code || !state) return fail("invalide");
  if (!verifyShopifyHmac(params, app.client_secret)) return fail("signature");
  if (request.cookies.get("pp_shopify_state")?.value !== `${app.id}.${state}`) return fail("expire");

  // À qui appartient cette boutique ? À l'app dédiée, sinon à la personne connectée.
  let userId = app.user_id;
  if (!userId) {
    const supabase = await supabaseUser();
    const { data } = await supabase.auth.getUser();
    userId = data.user?.id ?? null;
  }
  if (!userId) return NextResponse.redirect(new URL("/connexion", request.url));

  let token;
  try {
    token = await exchangeCode(shop, app, code);
  } catch (e) {
    console.error("shopify exchange", e);
    return fail("refus");
  }

  const db = supabaseAdmin();
  // Une boutique par client : on complète celle créée au paiement, sinon on la crée.
  const { data: existing } = await db.from("shops").select("id").eq("user_id", userId).order("created_at").limit(1);
  let shopId = existing?.[0]?.id as string | undefined;
  if (shopId) {
    const { error } = await db.from("shops").update({ shopify_domain: shop, updated_at: new Date().toISOString() }).eq("id", shopId);
    if (error) {
      console.error("shop update", error);
      return fail("deja");
    }
  } else {
    const empty = { orders: "o2", basket: "b2", today: "t1", shop: "" } as const;
    const r1 = relance1(empty);
    const r2 = relance2(empty);
    const { data, error } = await db
      .from("shops")
      .insert({
        user_id: userId,
        shopify_domain: shop,
        relance1_subject: r1.subject,
        relance1_body: r1.body,
        relance2_subject: r2.subject,
        relance2_body: r2.body,
      })
      .select("id")
      .single();
    if (error) {
      console.error("shop insert", error);
      return fail("deja");
    }
    shopId = data.id;
  }

  await db.from("shop_secrets").upsert({
    shop_id: shopId,
    shopify_access_token: token.access_token,
    shopify_app_id: app.id,
    refresh_token: token.refresh_token ?? null,
    access_token_expires_at: token.expires_in ? new Date(Date.now() + token.expires_in * 1000).toISOString() : null,
    updated_at: new Date().toISOString(),
  });

  try {
    await syncAbandonedCheckouts(shopId!);
  } catch (e) {
    console.error("first sync", e);
  }

  const res = NextResponse.redirect(new URL("/app?shopify=ok", request.url));
  res.cookies.delete({ name: "pp_shopify_state", path: "/api/shopify" });
  return res;
}
