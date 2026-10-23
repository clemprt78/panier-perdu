import Link from "next/link";

// Le symbole : un panier dans un carré vert bouteille, avec une pastille orange « retour » : le panier revient.
export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <rect width="40" height="40" rx="11" fill="#1f3d2b" />
      <path
        d="M7.5 13h3l2.5 11.4a1.8 1.8 0 0 0 1.8 1.4h9.4a1.8 1.8 0 0 0 1.7-1.3l1.6-6.5H12"
        fill="none"
        stroke="#fffdf8"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="15.8" cy="30.6" r="1.8" fill="#fffdf8" />
      <circle cx="23.8" cy="30.6" r="1.8" fill="#fffdf8" />
      <circle cx="29.5" cy="11" r="7" fill="#ff6b1a" />
      <path d="M29.5 7.7A3.3 3.3 0 1 1 26.2 11" fill="none" stroke="#fffdf8" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M24.7 9.9l1.5-1.6 1.6 1.6" fill="none" stroke="#fffdf8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Logo({ href = "/", className = "" }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={`inline-flex shrink-0 items-center gap-2 py-2 text-ink ${className}`} aria-label="Panier Perdu, accueil">
      <LogoMark />
      <span className="whitespace-nowrap font-poster text-xl uppercase leading-none tracking-wide">Panier Perdu</span>
    </Link>
  );
}
