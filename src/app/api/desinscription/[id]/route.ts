import { NextResponse, type NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/server/supabase";

// Désinscription confirmée (bouton de la page, ou bouton « Se désabonner » de la messagerie).
export async function POST(request: NextRequest, ctx: RouteContext<"/api/desinscription/[id]">) {
  const { id } = await ctx.params;
  if (/^[0-9a-f-]{36}$/.test(id)) {
    const db = supabaseAdmin();
    const { data: c } = await db.from("checkouts").select("email,shop_id").eq("id", id).maybeSingle();
    if (c) {
      await db.from("unsubscribes").upsert({ shop_id: c.shop_id, email: c.email }, { onConflict: "shop_id,email" });
      await db
        .from("checkouts")
        .update({ status: "stopped" })
        .eq("shop_id", c.shop_id)
        .eq("email", c.email)
        .in("status", ["pending", "relance1_sent", "relance2_sent"]);
    }
  }
  return NextResponse.redirect(new URL(`/desinscription/${id}?ok=1`, request.url), 303);
}
