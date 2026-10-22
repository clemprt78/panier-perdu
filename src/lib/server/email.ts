import "server-only";
import { Resend } from "resend";
import {
  GUARANTEE,
  LAUNCH_DATE_LABEL,
  PLANS,
  SETTINGS,
  relance1,
  relance2,
  type Answers,
  type Email,
  type PlanId,
} from "@/lib/diagnostic";
import { SITE } from "@/lib/site";

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function block(label: string, e: Email) {
  return `<h2 style="font:600 18px Georgia,serif;color:#1f3d2b;margin:28px 0 4px">${label}</h2>
<p style="margin:0;color:#5f625b;font-size:13px">${esc(e.when)}</p>
<p style="margin:10px 0 6px"><b>Objet :</b> ${esc(e.subject)}</p>
<pre style="white-space:pre-wrap;font:15px/1.6 system-ui,sans-serif;background:#f6f2ea;padding:14px;border-radius:8px;margin:0">${esc(e.body)}</pre>`;
}

function button(href: string, label: string) {
  return `<p style="margin:20px 0"><a href="${esc(href)}" style="display:inline-block;background:#d9541e;color:#fff;text-decoration:none;font-weight:600;padding:14px 22px;border-radius:8px">${esc(label)}</a></p>`;
}

export function loginEmailHtml(link: string) {
  return `<div style="max-width:560px;margin:0 auto;font:15px/1.6 system-ui,sans-serif;color:#1b1d1a">
<p style="font:800 22px Georgia,serif;color:#1f3d2b">Ton lien de connexion</p>
<p>Appuie sur le bouton pour ouvrir ton espace Panier Perdu. Le lien est valable une heure et ne sert qu'une fois.</p>
${button(link, "Ouvrir mon espace")}
<p style="color:#5f625b;font-size:13px">Tu n'as rien demandé ? Ignore simplement cet email.</p>
</div>`;
}

export function planEmailHtml(a: Answers, plan: PlanId, loginLink?: string) {
  return `<div style="max-width:560px;margin:0 auto;font:15px/1.6 system-ui,sans-serif;color:#1b1d1a">
<p style="font:800 22px Georgia,serif;color:#1f3d2b">Ton plan Panier Perdu est prêt.</p>
<p>Merci, ton abonnement <b>${esc(PLANS[plan].name)}</b> est actif. Voici ton plan complet. Tu peux le coller dès aujourd'hui dans Shopify : Marketing → Automatisations → « Panier abandonné ».</p>
${loginLink ? `${button(loginLink, "Ouvrir mon espace")}<p style="margin-top:-8px;color:#5f625b;font-size:13px">Lien valable une heure. Ensuite, reconnecte-toi depuis la page Connexion du site.</p>` : ""}
${block("Relance 1", relance1(a))}
${block("Relance 2, avec code de réduction", relance2(a))}
<p style="margin:10px 0 0;color:#5f625b;font-size:13px">Crée le code RETOUR10 dans Shopify (Remises → Créer une remise), 10 %, valable 48 h, un usage par client.</p>
<h2 style="font:600 18px Georgia,serif;color:#1f3d2b;margin:28px 0 8px">Les 4 réglages</h2>
<ol style="padding-left:20px;margin:0">${SETTINGS.map((s) => `<li style="margin-bottom:6px">${esc(s)}</li>`).join("")}</ol>
<h2 style="font:600 18px Georgia,serif;color:#1f3d2b;margin:28px 0 8px">La suite</h2>
<p>L'outil automatique (branchement à ta boutique, envoi des relances, compteur des euros récupérés) est mis en service ${LAUNCH_DATE_LABEL}. On t'écrit pour le brancher avec toi, en 10 minutes. S'il n'est pas en service dans ce délai, tu es remboursé en totalité.</p>
<p>Garantie : si ça ne te convient pas dans les ${GUARANTEE.days} jours, réponds simplement à cet email. Remboursement complet sous ${GUARANTEE.refundDays} jours.</p>
<p>Pour résilier, à tout moment : réponds à cet email.</p>
<p style="color:#5f625b">— ${esc(SITE.name)}</p>
</div>`;
}

export async function sendEmail(to: string, subject: string, html: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn("RESEND_API_KEY manquante : email non envoyé à", to);
    return;
  }
  const from = process.env.EMAIL_FROM || "Panier Perdu <onboarding@resend.dev>";
  const { error } = await new Resend(key).emails.send({
    from,
    to,
    subject,
    html,
    replyTo: process.env.OWNER_EMAIL || undefined,
  });
  if (error) console.error("resend", error);
}
