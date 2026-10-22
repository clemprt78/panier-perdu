import { NextResponse, type NextRequest } from "next/server";
import { supabaseUser } from "@/lib/server/supabase";

export async function POST(request: NextRequest) {
  const supabase = await supabaseUser();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/connexion", request.url), 303);
}
