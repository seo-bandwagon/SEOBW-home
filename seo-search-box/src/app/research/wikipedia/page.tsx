import { Metadata } from "next";
import { Navbar } from "@/components/common/Navbar";
import { WikiResearchClient } from "@/components/research/WikiResearchClient";

export const metadata: Metadata = {
  title: "Wikipedia Link Research - SEO Bandwagon",
  description: "Analysis of 25 Wikipedia pages ranking for digital marketing keywords. Link analysis and Wayback Machine historical data.",
};

export default function WikiResearchPage() {
  return (
    <div className="min-h-screen bg-[#000022]">
      <Navbar />
      <WikiResearchClient />
    </div>
  );
}
