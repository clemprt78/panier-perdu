import { NextResponse, type NextRequest } from "next/server";
import { supabaseUser } from "@/lib/server/supabase";

// Le lien reçu par email arrive ici : on vérifie le jeton, on ouvre la session.
export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type");

  if (tokenHash && type === "magiclink") {
    const supabase = await supabaseUser();
    const { error } = await supabase.auth.verifyOtp({ type: "magiclink", token_hash: tokenHash });
    if (!error) return NextResponse.redirect(new URL("/app", request.url));
  }
  return NextResponse.redirect(new URL("/connexion?erreur=lien", request.url));
}
