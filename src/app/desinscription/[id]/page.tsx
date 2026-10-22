import type { Metadata } from "next";
import { Suspense } from "react";
import { supabaseAdmin } from "@/lib/server/supabase";

export const metadata: Metadata = { title: "Désinscription", robots: { index: false } };

// Page neutre : le client de la boutique voit le nom de la boutique, pas Panier Perdu.
// La désinscription demande un clic (les antivirus de messagerie ouvrent les liens tout seuls).
export default function Page({ params, searchParams }: PageProps<"/desinscription/[id]">) {
  return (
    <main className="flex-1 px-4 pt-16 pb-12">
      <div className="mx-auto max-w-md">
        <Suspense fallback={<p className="text-muted">Un instant…</p>}>
          <Unsubscribe params={params} searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}

async function Unsubscribe({
  params,
  searchParams,
}: {
  params: PageProps<"/desinscription/[id]">["params"];
  searchParams: PageProps<"/desinscription/[id]">["searchParams"];
}) {
  const { id } = await params;
  const sp = await searchParams;
  let shopName = "";
  if (/^[0-9a-f-]{36}$/.test(id)) {
    const db = supabaseAdmin();
    const { data: c } = await db.from("checkouts").select("shop_id").eq("id", id).maybeSingle();
    if (c) {
      const { data: s } = await db.from("shops").select("name").eq("id", c.shop_id).single();
      shopName = s?.name ?? "";
    }
  }
  const from = shopName ? ` de la part de ${shopName}` : "";

  if (sp.ok === "1") {
    return (
      <>
        <h1 className="text-2xl font-semibold">C&apos;est noté.</h1>
        <p className="mt-3 leading-relaxed text-muted">Tu ne recevras plus de rappel de panier{from}.</p>
      </>
    );
  }
  return (
    <>
      <h1 className="text-2xl font-semibold">Ne plus recevoir de rappels ?</h1>
      <p className="mt-3 leading-relaxed text-muted">Tu ne recevras plus aucun rappel de panier{from}.</p>
      <form method="post" action={`/api/desinscription/${id}`} className="mt-6">
        <button className="h-12 w-full rounded-lg bg-ink font-semibold text-white">Confirmer</button>
      </form>
    </>
  );
}
