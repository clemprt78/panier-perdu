import Link from "next/link";

// Le symbole : un panier dans un carré vert bouteille, avec une flèche orange qui le ramène.
export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <rect width="40" height="40" rx="11" fill="#1f3d2b" />
      <path
        d="M9.5 12.5h3l2.4 11.2a1.8 1.8 0 0 0 1.8 1.4h9.2a1.8 1.8 0 0 0 1.7-1.3l1.9-7.3H14"
        fill="none"
        stroke="#fffdf8"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="17.5" cy="29.5" r="1.7" fill="#fffdf8" />
      <circle cx="25.5" cy="29.5" r="1.7" fill="#fffdf8" />
      <path d="M31.5 9.5a5 5 0 0 1-5 5" fill="none" stroke="#ff6b1a" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M28.6 12.3l-2.1 2.2 2.2 2" fill="none" stroke="#ff6b1a" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
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
