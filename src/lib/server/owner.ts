import "server-only";
import { supabaseUser } from "@/lib/server/supabase";

// Seul le propriétaire (OWNER_EMAIL) accède à l'administration.
export async function requireOwner() {
  const owner = process.env.OWNER_EMAIL?.trim().toLowerCase();
  const supabase = await supabaseUser();
  const { data } = await supabase.auth.getUser();
  const email = data.user?.email?.toLowerCase();
  if (!owner || !email || email !== owner) return null;
  return data.user!;
}
