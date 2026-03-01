import { Metadata } from "next";
import { Navbar } from "@/components/common/Navbar";
import { WikiResearchClient } from "@/components/research/WikiResearchClient";

export const metadata: Metadata = {
  title: "Wikipedia SEO Pages Analysis | 20 Years of Link & Content Evolution",
  description: "Comprehensive historical analysis of Wikipedia's Search Engine Optimization page. 181 external links tracked across 11 Wayback Machine snapshots from 2004-2024. Term frequency, citation sources, and content growth analysis.",
  openGraph: {
    title: "Wikipedia SEO Pages Analysis | 20 Years of Evolution",
    description: "181 external links catalogued. 25 SEO terms tracked. 6 key research findings. Free public research from SEO Bandwagon.",
    type: "article",
  },
};

export default function WikiResearchPage() {
  return (
    <div className="min-h-screen bg-[#000022]">
      <Navbar />
      <WikiResearchClient />
    </div>
  );
}
