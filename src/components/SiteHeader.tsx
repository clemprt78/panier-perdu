import Logo from "@/components/Logo";

// En-tête des pages intérieures : logo à gauche, une action à droite.
export default function SiteHeader({ right, logoHref = "/" }: { right?: React.ReactNode; logoHref?: string }) {
  return (
    <header className="flex h-16 items-center justify-between gap-3">
      <Logo href={logoHref} />
      {right}
    </header>
  );
}
