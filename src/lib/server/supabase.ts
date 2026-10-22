import "server-only";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SITE } from "@/lib/site";

const url = () => {
  const u = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!u) throw new Error("NEXT_PUBLIC_SUPABASE_URL manquante");
  return u;
};

export const supabaseConfigured = () =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY && process.env.SUPABASE_SECRET_KEY);

// Client « administrateur » : clé secrète, contourne les règles d'accès. Serveur uniquement.
export function supabaseAdmin() {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) throw new Error("SUPABASE_SECRET_KEY manquante");
  return createClient(url(), key, { auth: { persistSession: false, autoRefreshToken: false } });
}

// Client « utilisateur connecté » : lit la session dans les cookies, soumis aux règles d'accès.
export async function supabaseUser() {
  const store = await cookies();
  return createServerClient(url(), process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // Appelé depuis un composant serveur : le proxy se charge de rafraîchir les cookies.
        }
      },
    },
  });
}

// Crée le compte s'il n'existe pas, et renvoie un lien de connexion à usage unique.
export async function loginLinkFor(email: string, createIfMissing: boolean) {
  const admin = supabaseAdmin();
  if (!createIfMissing) {
    // On ne crée pas de compte depuis la page de connexion : seulement après un paiement.
    const { data } = await admin.rpc("user_exists", { p_email: email });
    if (!data) return null;
  }
  const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  if (error || !data.properties?.hashed_token) {
    console.error("generateLink", error);
    return null;
  }
  const link = `${SITE.url}/auth/confirm?token_hash=${encodeURIComponent(data.properties.hashed_token)}&type=magiclink`;
  return { link, userId: data.user.id };
}
