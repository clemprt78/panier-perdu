"use client";

import { useActionState } from "react";
import { requestLoginLink, type LoginState } from "./actions";

export default function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(requestLoginLink, { status: "idle" });

  if (state.status === "sent") {
    return (
      <div className="mt-6 rounded-lg border-2 border-bottle bg-white p-4" role="status">
        <p className="font-semibold text-bottle">Regarde ta boîte mail.</p>
        <p className="mt-1 text-sm leading-relaxed">
          Si cette adresse correspond à un compte client, un lien de connexion vient de partir. Il est valable une heure.
          Pense aux spams.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="mt-6">
      <label className="block">
        <span className="text-sm font-medium">Ton email</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          className="mt-1 block h-12 w-full rounded-lg border-2 border-line bg-white px-3 text-base focus:border-bottle focus:outline-none"
        />
      </label>
      {state.status === "error" && (
        <p role="alert" className="mt-2 text-sm text-brick-dark">
          {state.message}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="mt-4 flex h-14 w-full items-center justify-center rounded-full bg-ink text-lg font-semibold text-white hover:bg-black disabled:opacity-60"
      >
        {pending ? "Envoi…" : "Recevoir mon lien"}
      </button>
    </form>
  );
}
