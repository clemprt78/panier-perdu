"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { supabaseUser } from "@/lib/server/supabase";
import { syncAbandonedCheckouts } from "@/lib/server/shopify";

export async function signOut() {
  const supabase = await supabaseUser();
  await supabase.auth.signOut();
  redirect("/connexion");
}

export async function syncNow() {
  const supabase = await supabaseUser();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/connexion");
  const { data: shops } = await supabase.from("shops").select("id,shopify_domain").limit(1);
  const shop = shops?.[0];
  if (shop?.shopify_domain) {
    try {
      await syncAbandonedCheckouts(shop.id);
    } catch (e) {
      console.error("sync", e);
    }
  }
  revalidatePath("/app");
}
