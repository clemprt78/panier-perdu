"use client";

import { useActionState } from "react";
import { createManualCustomer, registerShopifyApp, type AdminState } from "./actions";

const input =
  "mt-1 block h-12 w-full rounded-lg border-2 border-line bg-white px-3 text-base focus:border-bottle focus:outline-none";

function Feedback({ state }: { state: AdminState }) {
  if (state.ok) return <p className="mt-3 text-sm font-medium text-bottle" role="status">{state.ok}</p>;
  if (state.error) return <p className="mt-3 text-sm text-brick-dark" role="alert">{state.error}</p>;
  return null;
}

export function ManualCustomerForm() {
  const [state, action, pending] = useActionState<AdminState, FormData>(createManualCustomer, {});
  return (
    <form action={action} className="mt-3 space-y-3">
      <label className="block">
        <span className="text-sm font-medium">Email du client</span>
        <input name="email" type="email" required className={input} />
      </label>
      <label className="block">
        <span className="text-sm font-medium">Nom de sa boutique</span>
        <input name="shop" maxLength={40} className={input} />
      </label>
      <label className="block">
        <span className="text-sm font-medium">Formule</span>
        <select name="plan" defaultValue="fondateur" className={input}>
          <option value="fondateur">Fondateur (29 €/mois)</option>
          <option value="mensuel">Mensuel (39 €/mois)</option>
          <option value="annuel">Annuel (390 €/an)</option>
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="sendLink" defaultChecked className="h-5 w-5 accent-[#1f3d2b]" />
        Lui envoyer son lien de connexion maintenant
      </label>
      <button disabled={pending} className="h-12 w-full rounded-lg bg-bottle font-semibold text-white disabled:opacity-60">
        {pending ? "Création…" : "Créer le client"}
      </button>
      <Feedback state={state} />
    </form>
  );
}

export function ShopifyAppForm() {
  const [state, action, pending] = useActionState<AdminState, FormData>(registerShopifyApp, {});
  return (
    <form action={action} className="mt-3 space-y-3">
      <label className="block">
        <span className="text-sm font-medium">Email du client (déjà créé)</span>
        <input name="email" type="email" required className={input} />
      </label>
      <label className="block">
        <span className="text-sm font-medium">Client ID</span>
        <input name="clientId" required autoComplete="off" className={input} />
      </label>
      <label className="block">
        <span className="text-sm font-medium">Secret</span>
        <input name="clientSecret" type="password" required autoComplete="off" className={input} />
      </label>
      <button disabled={pending} className="h-12 w-full rounded-lg bg-bottle font-semibold text-white disabled:opacity-60">
        {pending ? "Enregistrement…" : "Enregistrer l'application"}
      </button>
      <Feedback state={state} />
    </form>
  );
}
