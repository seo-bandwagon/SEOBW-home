import { Navbar } from "@/components/common/Navbar";
import { WikiAnalysisClient } from "@/components/dashboard/WikiAnalysisClient";

export const metadata = {
  title: "Wikipedia SEO Analysis — SEO Bandwagon",
  description: "In-depth analysis of digital marketing Wikipedia pages: revision history, link evolution, section changes, and Wayback Machine data across 41 pages.",
};

export default function WikiAnalysisPage() {
  return (
    <div className="min-h-screen bg-[#000022]">
      <Navbar />
      <main className="max-w-7xl mx-auto p-6 md:p-8">
        <WikiAnalysisClient />
      </main>
    </div>
  );
}
