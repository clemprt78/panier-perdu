"use server";

import { z } from "zod";
import { loginLinkFor, supabaseConfigured } from "@/lib/server/supabase";
import { loginEmailHtml, sendEmail } from "@/lib/server/email";

export type LoginState = { status: "idle" | "sent" | "error"; message?: string };

export async function requestLoginLink(_prev: LoginState, form: FormData): Promise<LoginState> {
  const parsed = z.email().max(200).safeParse(String(form.get("email") ?? "").trim().toLowerCase());
  if (!parsed.success) return { status: "error", message: "Cette adresse email ne semble pas valide." };
  if (!supabaseConfigured()) return { status: "error", message: "La connexion n'est pas encore ouverte." };

  const result = await loginLinkFor(parsed.data, false);
  if (result) await sendEmail(parsed.data, "Ton lien de connexion à Panier Perdu", loginEmailHtml(result.link));

  // Même réponse que le compte existe ou non : on ne révèle pas qui est client.
  return { status: "sent" };
}
