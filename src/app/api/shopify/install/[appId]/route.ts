import { randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { SHOPIFY_SCOPES, getApp, validShop, verifyShopifyHmac } from "@/lib/server/shopify";
import { SITE } from "@/lib/site";

// « App URL » de l'application Shopify : Shopify y envoie le marchand après l'installation.
// On lance alors l'autorisation pour obtenir le jeton d'accès.
export async function GET(request: NextRequest, ctx: RouteContext<"/api/shopify/install/[appId]">) {
  const { appId } = await ctx.params;
  const params = request.nextUrl.searchParams;
  const shop = params.get("shop");
  const app = await getApp(appId);

  if (!app || !validShop(shop)) {
    return new Response("Lien d'installation invalide.", { status: 400 });
  }
  if (params.has("hmac") && !verifyShopifyHmac(params, app.client_secret)) {
    return new Response("Signature Shopify invalide.", { status: 401 });
  }

  const state = randomBytes(16).toString("hex");
  const redirectUri = `${SITE.url}/api/shopify/callback/${app.id}`;
  const authorize = new URL(`https://${shop}/admin/oauth/authorize`);
  authorize.searchParams.set("client_id", app.client_id);
  authorize.searchParams.set("scope", SHOPIFY_SCOPES);
  authorize.searchParams.set("redirect_uri", redirectUri);
  authorize.searchParams.set("state", state);

  const res = NextResponse.redirect(authorize);
  res.cookies.set("pp_shopify_state", `${app.id}.${state}`, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 600,
    path: "/api/shopify",
  });
  return res;
}
