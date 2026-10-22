import { ImageResponse } from "next/og";

export const alt = "Panier Perdu — Récupère les paniers abandonnés de ta boutique.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#f6f2ea",
          padding: 72,
          fontFamily: "Georgia, serif",
        }}
      >
        <div style={{ fontSize: 36, color: "#1f3d2b", fontWeight: 700 }}>Panier Perdu</div>
        <div style={{ fontSize: 76, color: "#1b1d1a", fontWeight: 800, lineHeight: 1.05, maxWidth: 1000 }}>
          Récupère les paniers abandonnés de ta boutique.
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div style={{ background: "#d9541e", color: "white", fontSize: 32, padding: "16px 28px", borderRadius: 12 }}>
            Ton diagnostic gratuit en 1 minute
          </div>
        </div>
      </div>
    ),
    size,
  );
}
