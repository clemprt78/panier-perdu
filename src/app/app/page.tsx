import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import Logo from "@/components/Logo";
import { EmailCard } from "@/app/diagnostic/Funnel";
import { LAUNCH_DATE_LABEL, PLANS, type PlanId } from "@/lib/diagnostic";
import { supabaseUser } from "@/lib/server/supabase";
import { requireOwner } from "@/lib/server/owner";
import { SITE } from "@/lib/site";
import CopyText from "@/components/CopyText";

export const metadata: Metadata = { title: "Mon espace", robots: { index: false } };

const SHOPIFY_MSG: Record<string, { ok: boolean; text: string }> = {
  ok: { ok: true, text: "Ta boutique est branchée. Les paniers abandonnés des 14 derniers jours sont affichés." },
  invalide: { ok: false, text: "Le lien de branchement est invalide. Recommence depuis Shopify." },
  signature: { ok: false, text: "La réponse de Shopify n'a pas pu être vérifiée. Recommence." },
  expire: { ok: false, text: "Le branchement a pris trop de temps. Recommence depuis Shopify." },
  refus: { ok: false, text: "Shopify a refusé l'accès. Vérifie l'application puis recommence." },
  deja: { ok: false, text: "Cette boutique est déjà reliée à un autre compte. Écris-nous." },
};

const STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: "À relancer", cls: "bg-[#f3e2d8] text-brick-dark" },
  relance1_sent: { label: "Relance 1 envoyée", cls: "bg-[#dfe7f3] text-[#0f3550]" },
  relance2_sent: { label: "Relance 2 envoyée", cls: "bg-[#e6e1fb] text-[#2b2166]" },
  recovered: { label: "Récupéré", cls: "bg-[#d6ecdd] text-bottle" },
  stopped: { label: "Clôturé", cls: "bg-paper-deep text-muted" },
};

const TZ = "Europe/Paris";
const dayKey = (d: Date) => new Intl.DateTimeFormat("fr-CA", { timeZone: TZ }).format(d); // AAAA-MM-JJ
const dateTime = (iso: string) =>
  new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: TZ }).format(
    new Date(iso),
  );

// Fenêtres de temps (calculées à chaque affichage).
function timeWindow() {
  const now = Date.now();
  const m = new Date(now);
  m.setDate(1);
  m.setHours(0, 0, 0, 0);
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(now - (13 - i) * 24 * 3600 * 1000);
    return { key: dayKey(d), label: new Intl.DateTimeFormat("fr-FR", { day: "numeric", timeZone: TZ }).format(d), ab: 0, rec: 0 };
  });
  return { since: new Date(now - 30 * 24 * 3600 * 1000).toISOString(), monthStart: m.toISOString(), days };
}

export default function AppPage({ searchParams }: PageProps<"/app">) {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-dvh place-items-center bg-paper text-muted">
          <p>Chargement de ton espace…</p>
        </main>
      }
    >
      <Dashboard searchParams={searchParams} />
    </Suspense>
  );
}

export type Cart = {
  id: string;
  email: string;
  first_name: string | null;
  total_cents: number;
  currency: string;
  abandoned_at: string;
  status: string;
  relance1_sent_at: string | null;
  relance2_sent_at: string | null;
  recovered_cents: number | null;
  recovered_at: string | null;
};

async function Dashboard({ searchParams }: { searchParams: PageProps<"/app">["searchParams"] }) {
  const sp = await searchParams;
  const n = Number(typeof sp.n === "string" ? sp.n : 0) || 0;
  const SYNC_MSG: Record<string, { ok: boolean; text: string }> = {
    ok: {
      ok: true,
      text: n ? `C'est à jour : ${n} panier${n > 1 ? "s" : ""} avec email sur 14 jours.` : "C'est à jour : aucun nouveau panier.",
    },
    erreur: { ok: false, text: "Shopify n'a pas répondu. Réessaie dans une minute." },
    nonbranchee: { ok: false, text: "Ta boutique n'est pas encore branchée." },
  };
  const msg =
    (typeof sp.shopify === "string" ? SHOPIFY_MSG[sp.shopify] : undefined) ??
    (typeof sp.sync === "string" ? SYNC_MSG[sp.sync] : undefined);

  const supabase = await supabaseUser();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const [{ data: subs }, { data: shops }, owner] = await Promise.all([
    supabase.from("subscriptions").select("plan,status").order("created_at", { ascending: false }).limit(1),
    supabase.from("shops").select("*").order("created_at").limit(1),
    requireOwner(),
  ]);
  const sub = subs?.[0];
  const shop = shops?.[0];
  // Données des 30 derniers jours
  const { since, monthStart, days } = timeWindow();

  let carts: Cart[] = [];
  let recoveredMonth = 0;
  let currency = "EUR";
  if (shop) {
    const [{ data: rows }, { data: rec }] = await Promise.all([
      supabase
        .from("checkouts")
        .select(
          "id,email,first_name,total_cents,currency,abandoned_at,status,relance1_sent_at,relance2_sent_at,recovered_cents,recovered_at",
        )
        .eq("shop_id", shop.id)
        .gte("abandoned_at", since)
        .order("abandoned_at", { ascending: false })
        .limit(500),
      supabase
        .from("checkouts")
        .select("recovered_cents,currency")
        .eq("shop_id", shop.id)
        .gte("recovered_at", monthStart),
    ]);
    carts = (rows ?? []) as Cart[];
    recoveredMonth = (rec ?? []).reduce((s, r) => s + (r.recovered_cents ?? 0), 0) / 100;
    currency = carts[0]?.currency ?? rec?.[0]?.currency ?? "EUR";
  }
  return (
    <DashboardView
      email={user.email ?? ""}
      shop={shop ?? null}
      sub={sub ?? null}
      owner={Boolean(owner)}
      msg={msg ?? null}
      carts={carts}
      recoveredMonth={recoveredMonth}
      currency={currency}
      days={days}
    />
  );
}

type Shop = {
  name: string;
  shopify_domain: string | null;
  last_synced_at: string | null;
  relance1_subject: string;
  relance1_body: string;
  relance1_delay_minutes: number;
  relance2_subject: string;
  relance2_body: string;
  relance2_delay_hours: number;
  discount_enabled: boolean;
  discount_percent: number;
};

export function DashboardView({
  email,
  shop,
  sub,
  owner,
  msg,
  carts,
  recoveredMonth,
  currency,
  days,
  demo = false,
}: {
  demo?: boolean;
  email: string;
  shop: Shop | null;
  sub: { plan: string; status: string } | null;
  owner: boolean;
  msg: { ok: boolean; text: string } | null;
  carts: Cart[];
  recoveredMonth: number;
  currency: string;
  days: { key: string; label: string; ab: number; rec: number }[];
}) {
  const connected = Boolean(shop?.shopify_domain);
  const active = Boolean(sub && ["active", "trialing"].includes(sub.status));
  const money = (v: number) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency, maximumFractionDigits: 0 }).format(v);

  const relances = carts.reduce((s, c) => s + (c.relance1_sent_at ? 1 : 0) + (c.relance2_sent_at ? 1 : 0), 0);
  const relanced = carts.filter((c) => c.relance1_sent_at).length;
  const recoveredCount = carts.filter((c) => c.status === "recovered").length;
  const rate = relanced ? Math.round((recoveredCount / relanced) * 100) : null;

  // Graphique : 14 derniers jours
  for (const c of carts) {
    const a = days.find((d) => d.key === dayKey(new Date(c.abandoned_at)));
    if (a) a.ab++;
    if (c.recovered_at) {
      const r = days.find((d) => d.key === dayKey(new Date(c.recovered_at!)));
      if (r) r.rec++;
    }
  }
  const max = Math.max(1, ...days.map((d) => d.ab));

  const lastSync = shop?.last_synced_at ? dateTime(shop.last_synced_at) : null;

  return (
    <main className="flex min-h-dvh flex-col bg-paper lg:h-dvh lg:overflow-hidden">
      {/* Barre du haut */}
      <header className="border-b border-line bg-paper">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between gap-3 px-4">
          <div className="flex min-w-0 items-center gap-4">
            <Logo href={demo ? "/" : "/app"} />
            {shop?.name && (
              <span className="hidden truncate border-l border-line pl-4 text-sm font-medium text-muted md:inline">{shop.name}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {demo ? (
              <>
                <span className="hidden rounded-full bg-[#ff6b1a] px-3 py-1 text-xs font-semibold uppercase tracking-wider text-ink sm:inline-block">
                  Démo
                </span>
                <a
                  href="/diagnostic"
                  className="whitespace-nowrap rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-black"
                >
                  Commencer<span className="hidden sm:inline">, c&apos;est gratuit</span>
                </a>
              </>
            ) : (
              <>
              {owner && (
                <a href="/app/admin" className="hidden rounded-full px-3 py-2 text-sm font-semibold text-ink hover:bg-paper-deep sm:inline-block">
                  Administration
                </a>
              )}
              {connected && (
                <form method="post" action="/api/shopify/sync">
                  <button
                    className="whitespace-nowrap rounded-full border-2 border-ink px-3 py-1.5 text-sm font-semibold text-ink hover:bg-ink hover:text-white sm:px-4"
                    aria-label="Actualiser les paniers"
                  >
                    ↻<span className="hidden sm:inline"> Actualiser</span>
                  </button>
                </form>
              )}
              <form method="post" action="/auth/deconnexion">
                <button className="whitespace-nowrap rounded-full px-2 py-2 text-sm text-muted hover:text-ink sm:px-3" title="Se déconnecter">
                  Déconnexion
                </button>
              </form>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="pp-enter mx-auto w-full max-w-[1600px] flex-1 p-4 lg:min-h-0">
        {demo && (
          <p className="mb-4 rounded-2xl border-2 border-dashed border-[#ff6b1a] bg-white px-4 py-3 text-sm">
            <b>Exemple d&apos;espace client</b>, avec une boutique et des clients fictifs. C&apos;est ce que tu verras une fois
            ta boutique branchée.
          </p>
        )}
        {msg && (
          <p
            role="status"
            className={`mb-4 rounded-2xl border-2 bg-white px-4 py-3 text-sm ${msg.ok ? "border-bottle" : "border-brick"}`}
          >
            {msg.text}
          </p>
        )}
        {owner && (
          <a href="/app/admin" className="mb-4 inline-block rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white sm:hidden">
            Administration
          </a>
        )}

        <div className="grid gap-4 lg:h-full lg:min-h-0 lg:grid-cols-12">
          {/* Colonne principale */}
          <div className="flex flex-col gap-4 lg:col-span-8 lg:min-h-0">
            {/* Chiffres clés */}
            <section aria-label="Chiffres clés" className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              <div className="col-span-2 flex flex-col justify-between rounded-3xl bg-bottle p-5 text-white shadow-[0_24px_50px_-30px_rgba(31,61,43,0.9)] xl:col-span-1">
                <p className="text-xs font-semibold uppercase tracking-widest text-white/70">Récupéré ce mois-ci</p>
                <p className="mt-2 font-poster text-5xl leading-none num">{money(recoveredMonth)}</p>
                <p className="mt-2 text-xs text-white/70">Commandes passées dans les 7 jours après une relance</p>
              </div>
              <Kpi label="Paniers abandonnés" value={String(carts.length)} hint="30 derniers jours" />
              <Kpi label="Relances envoyées" value={String(relances)} hint="30 derniers jours" />
              <Kpi
                label="Taux de récupération"
                value={rate === null ? "—" : `${rate} %`}
                hint={rate === null ? "Après les premières relances" : `${recoveredCount} sur ${relanced} relancés`}
                className="col-span-2 xl:col-span-1"
              />
            </section>

            {/* Paniers */}
            <section className="flex flex-col overflow-hidden rounded-3xl border border-line bg-white lg:min-h-0 lg:flex-1">
              <div className="flex items-baseline justify-between gap-3 border-b border-line px-5 py-4">
                <h2 className="whitespace-nowrap font-poster text-2xl uppercase">Paniers abandonnés</h2>
                <p className="text-right text-xs text-muted">{lastSync ? `Mis à jour le ${lastSync}` : connected ? "Mise à jour toutes les 5 min" : ""}</p>
              </div>
              {!connected ? (
                <Empty
                  title="Ta boutique n'est pas encore branchée"
                  text={`Mise en service ${LAUNCH_DATE_LABEL} : on t'écrit pour la brancher avec toi, en 10 minutes. Tes paniers apparaîtront ici.`}
                />
              ) : !carts.length ? (
                <Empty
                  title="Aucun panier abandonné pour l'instant"
                  text="Shopify compte un panier comme abandonné 10 minutes après que le client a saisi son email sans payer. Ils s'afficheront ici automatiquement."
                />
              ) : (
                <div className="overflow-auto lg:min-h-0 lg:flex-1">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-white text-left text-xs uppercase tracking-wider text-muted">
                      <tr>
                        <th className="w-[40%] py-3 pl-5 pr-2 font-medium sm:w-auto sm:px-5">Client</th>
                        <th className="hidden px-3 py-3 font-medium sm:table-cell">Abandon</th>
                        <th className="px-1 py-3 font-medium sm:px-3">Statut</th>
                        <th className="px-5 py-3 text-right font-medium">Panier</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {carts.map((c) => {
                        const st = STATUS[c.status] ?? STATUS.stopped;
                        return (
                          <tr key={c.id} className="hover:bg-paper/60">
                            <td className="max-w-0 py-3 pl-5 pr-2 sm:px-5">
                              <p className="truncate font-medium text-ink">{c.first_name || c.email.split("@")[0]}</p>
                              <p className="hidden truncate text-xs text-muted sm:block">{c.email}</p>
                              <p className="whitespace-nowrap text-xs text-muted sm:hidden">{dateTime(c.abandoned_at)}</p>
                            </td>
                            <td className="hidden whitespace-nowrap px-3 py-3 text-muted sm:table-cell">{dateTime(c.abandoned_at)}</td>
                            <td className="px-1 py-3 sm:px-3">
                              <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${st.cls}`}>
                                {st.label}
                              </span>
                            </td>
                            <td className="whitespace-nowrap py-3 pl-2 pr-5 text-right font-semibold num sm:px-5">
                              {new Intl.NumberFormat("fr-FR", { style: "currency", currency: c.currency }).format(c.total_cents / 100)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>

          {/* Colonne latérale */}
          <aside className="flex flex-col gap-4 lg:col-span-4 lg:min-h-0 lg:overflow-auto lg:pr-1">
            {/* Graphique 14 jours */}
            <section className="rounded-3xl border border-line bg-white p-5">
              <div className="flex items-baseline justify-between">
                <h2 className="font-poster text-xl uppercase">14 derniers jours</h2>
                <div className="flex gap-3 text-xs text-muted">
                  <span className="flex items-center gap-1">
                    <span className="h-2.5 w-2.5 rounded-sm bg-[#e3d9c6]" /> Abandons
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2.5 w-2.5 rounded-sm bg-bottle" /> Récupérés
                  </span>
                </div>
              </div>
              <div className="mt-4 flex h-28 items-end gap-1" role="img" aria-label="Paniers abandonnés et récupérés par jour sur 14 jours">
                {days.map((d) => (
                  <div key={d.key} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                    <div className="relative w-full flex-1">
                      <div
                        className="absolute inset-x-0 bottom-0 rounded-t bg-[#e3d9c6]"
                        style={{ height: `${(d.ab / max) * 100}%`, minHeight: d.ab ? 4 : 0 }}
                        title={`${d.ab} abandon(s)`}
                      />
                      <div
                        className="absolute inset-x-1 bottom-0 rounded-t bg-bottle"
                        style={{ height: `${(d.rec / max) * 100}%`, minHeight: d.rec ? 4 : 0 }}
                        title={`${d.rec} récupéré(s)`}
                      />
                    </div>
                    <span className="text-[0.6rem] text-muted num">{d.label}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Mise en route, tant que tout n'est pas fait */}
            {!(connected && relances > 0) && (
              <section className="rounded-3xl border border-line bg-white p-5">
                <h2 className="font-poster text-xl uppercase">Ta mise en route</h2>
                <ol className="mt-3 space-y-3">
                  <StepItem done title="Ton plan de relance est prêt" />
                  <StepItem done={connected} title="Boutique Shopify branchée" text={shop?.shopify_domain ?? "On la branche avec toi, en 10 min."} />
                  <StepItem done={relances > 0} title="Premières relances envoyées" text="Automatique dès le premier panier abandonné." />
                </ol>
              </section>
            )}

            {/* Relances */}
            {shop && (
              <section className="rounded-3xl border border-line bg-white p-5">
                <h2 className="font-poster text-xl uppercase">Tes relances</h2>
                <details className="group mt-3 rounded-2xl bg-paper p-1">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2.5">
                    <span>
                      <span className="block font-semibold">Relance 1</span>
                      <span className="block text-xs text-muted">{shop.relance1_delay_minutes} min après l&apos;abandon</span>
                    </span>
                    <span className="text-xl text-muted transition-transform group-open:rotate-45" aria-hidden>
                      +
                    </span>
                  </summary>
                  <EmailCard
                    label="Aperçu"
                    email={{ when: "", subject: shop.relance1_subject, body: shop.relance1_body }}
                  />
                  <CopyActions subject={shop.relance1_subject} body={shop.relance1_body} />
                </details>
                <details className="group mt-2 rounded-2xl bg-paper p-1">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2.5">
                    <span>
                      <span className="block font-semibold">Relance 2</span>
                      <span className="block text-xs text-muted">
                        {shop.relance2_delay_hours} h après{shop.discount_enabled ? ` · code unique −${shop.discount_percent} %` : ""}
                      </span>
                    </span>
                    <span className="text-xl text-muted transition-transform group-open:rotate-45" aria-hidden>
                      +
                    </span>
                  </summary>
                  <EmailCard
                    label="Aperçu"
                    email={{ when: "", subject: shop.relance2_subject, body: shop.relance2_body }}
                  />
                  <CopyActions subject={shop.relance2_subject} body={shop.relance2_body} />
                </details>
                <p className="mt-3 text-xs text-muted">Une modification à faire ? Écris-nous, on l&apos;applique pour toi.</p>
              </section>
            )}

            {/* Abonnement */}
            <section className="rounded-3xl border border-line bg-white p-5">
              <h2 className="font-poster text-xl uppercase">Mon abonnement</h2>
              {sub ? (
                <div className="mt-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">Formule {PLANS[sub.plan as PlanId]?.name ?? sub.plan}</p>
                    <p className="text-xs text-muted">{email}</p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${active ? "bg-[#d6ecdd] text-bottle" : "bg-[#f3e2d8] text-brick-dark"}`}
                  >
                    {active ? "Active" : "Inactive"}
                  </span>
                </div>
              ) : (
                <p className="mt-3 text-sm text-muted">Aucun abonnement trouvé pour {email}. Écris-nous si c&apos;est une erreur.</p>
              )}
              <p className="mt-4 text-xs leading-relaxed text-muted">
                Une question, une résiliation ? Écris à <span className="text-ink">{SITE.contact}</span>. Réponse sous 24 h.
              </p>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}

function CopyActions({ subject, body }: { subject: string; body: string }) {
  return (
    <div className="flex flex-wrap gap-2 px-3 pb-3 pt-3">
      <CopyText text={`Objet : ${subject}\n\n${body}`} label="Copier l'email" className="flex-1" />
      <CopyText text={subject} label="Copier l'objet" />
    </div>
  );
}

function Kpi({ label, value, hint, className = "" }: { label: string; value: string; hint: string; className?: string }) {
  return (
    <div className={`flex flex-col justify-between rounded-3xl border border-line bg-white p-5 ${className}`}>
      <p className="text-xs font-semibold uppercase tracking-widest text-muted">{label}</p>
      <p className="mt-2 font-poster text-4xl leading-none text-ink num">{value}</p>
      <p className="mt-2 text-xs text-muted">{hint}</p>
    </div>
  );
}

function Empty({ title, text }: { title: string; text: string }) {
  return (
    <div className="grid flex-1 place-items-center p-8 text-center">
      <div className="max-w-sm">
        <p className="font-semibold text-ink">{title}</p>
        <p className="mt-2 text-sm leading-relaxed text-muted">{text}</p>
      </div>
    </div>
  );
}

function StepItem({ done, title, text }: { done: boolean; title: string; text?: string }) {
  return (
    <li className="flex gap-3">
      <span
        className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs ${
          done ? "bg-bottle text-white" : "border-2 border-line text-transparent"
        }`}
        aria-hidden="true"
      >
        ✓
      </span>
      <div className="min-w-0">
        <p className="font-semibold leading-tight">
          {title}
          <span className="sr-only">{done ? " (fait)" : " (à venir)"}</span>
        </p>
        {text && <p className="mt-0.5 truncate text-xs text-muted">{text}</p>}
      </div>
    </li>
  );
}
