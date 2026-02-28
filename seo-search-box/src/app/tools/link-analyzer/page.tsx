import { Metadata } from "next";
import { MarketingNavbar } from "@/components/common/MarketingNavbar";
import { LinkAnalyzerClient } from "@/components/link-analyzer/LinkAnalyzerClient";

export const metadata: Metadata = {
  title: "Link Analyzer - SEO Bandwagon",
  description: "Analyze internal and external links on any webpage. Find broken links, check anchor text distribution, and optimize your link structure.",
};

export default function LinkAnalyzerPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <MarketingNavbar />
      <LinkAnalyzerClient />
    </div>
  );
}
