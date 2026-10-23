"use client";

import { useState } from "react";

// Bouton « Copier » : met le texte dans le presse-papiers, avec confirmation.
export default function CopyText({ text, label = "Copier le texte", className = "" }: { text: string; label?: string; className?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          // Navigateurs anciens : copie via une zone de texte temporaire
          const t = document.createElement("textarea");
          t.value = text;
          document.body.appendChild(t);
          t.select();
          document.execCommand("copy");
          t.remove();
        }
        setDone(true);
        setTimeout(() => setDone(false), 2200);
      }}
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-full border-2 border-ink px-4 text-sm font-semibold text-ink transition-colors hover:bg-ink hover:text-white active:scale-[0.98] ${
        done ? "bg-ink text-white" : ""
      } ${className}`}
      aria-live="polite"
    >
      {done ? "✓ Copié" : label}
    </button>
  );
}
