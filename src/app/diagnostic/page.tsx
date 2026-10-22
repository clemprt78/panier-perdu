import type { Metadata } from "next";
import Funnel from "./Funnel";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Ton diagnostic en 3 questions",
  description: "Combien de paniers abandonnés te coûtent chaque mois ? Réponds à 3 questions, on fait le calcul.",
};

export default function DiagnosticPage() {
  return (
    <>
      <Funnel />
      <Footer />
    </>
  );
}
