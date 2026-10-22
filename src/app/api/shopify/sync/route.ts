import { NextResponse, type NextRequest } from "next/server";
import { syncAbandonedCheckouts } from "@/lib/server/shopify";
import { supabaseUser } from "@/lib/server/supabase";

// Bouton « Actualiser » : formulaire classique, fonctionne même si le JavaScript de la page plante.
export async function POST(request: NextRequest) {
  const back = (q: string) => NextResponse.redirect(new URL(`/app?${q}`, request.url), 303);

  const supabase = await supabaseUser();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.redirect(new URL("/connexion", request.url), 303);

  const { data: shops } = await supabase.from("shops").select("id,shopify_domain").order("created_at").limit(1);
  const shop = shops?.[0];
  if (!shop?.shopify_domain) return back("sync=nonbranchee");

  try {
    const { found } = await syncAbandonedCheckouts(shop.id);
    return back(`sync=ok&n=${found}`);
  } catch (e) {
    console.error("sync", e);
    return back("sync=erreur");
  }
}
