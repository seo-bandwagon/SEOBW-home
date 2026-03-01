import { Metadata } from "next";
import { Navbar } from "@/components/common/Navbar";
import { WikiResearchClient } from "@/components/research/WikiResearchClient";

export const metadata: Metadata = {
  title: "Wikipedia Link Analysis - SEO Bandwagon",
  description: "Historical analysis of Wikipedia pages ranking for digital marketing keywords using Wayback Machine.",
};

export default function WikiAnalysisPage() {
  return (
    <div className="min-h-screen bg-[#000022]">
      <Navbar />
      <WikiResearchClient />
    </div>
  );
}
