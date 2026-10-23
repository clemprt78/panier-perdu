// Titre en relief, comme sur l'accueil.
export const relief = (c: string) =>
  [1, 2, 3, 4].map((i) => `${i}px ${i}px 0 ${c}b3`).join(", ") + `, 5px 12px 24px rgba(0,0,0,0.18)`;

export function PosterTitle({ children, ink, className = "" }: { children: React.ReactNode; ink: string; className?: string }) {
  return (
    <h1
      className={`font-poster uppercase leading-[0.95] text-[clamp(2.1rem,8.5vw,3.6rem)] ${className}`}
      style={{ color: "#fffdf8", textShadow: relief(ink) }}
    >
      {children}
    </h1>
  );
}
