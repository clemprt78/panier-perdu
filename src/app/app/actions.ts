"use server";

import { redirect } from "next/navigation";
import { supabaseUser } from "@/lib/server/supabase";

export async function signOut() {
  const supabase = await supabaseUser();
  await supabase.auth.signOut();
  redirect("/connexion");
}
