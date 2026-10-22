import { timingSafeEqual } from "node:crypto";
import { runAll } from "@/lib/server/relances";
import { supabaseAdmin } from "@/lib/server/supabase";

export const maxDuration = 300;

// Appelé toutes les 5 minutes par Supabase (pg_cron). Protégé par un jeton qui ne quitte jamais la base.
export async function POST(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const { data } = await supabaseAdmin().from("app_secrets").select("value").eq("name", "cron").single();
  const expected = data?.value ? `Bearer ${data.value}` : null;
  const a = Buffer.from(header);
  const b = Buffer.from(expected ?? "");
  if (!expected || a.length !== b.length || !timingSafeEqual(a, b)) {
    return new Response("Non autorisé", { status: 401 });
  }
  const results = await runAll();
  console.log("relances", JSON.stringify(results));
  return Response.json({ ok: true, results });
}
