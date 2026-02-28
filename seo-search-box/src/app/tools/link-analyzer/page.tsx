import { Navbar } from "@/components/common/Navbar";
import { LinkAnalyzerClient } from "@/components/tools/LinkAnalyzerClient";
import { Link2 } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Link Analyzer | Free On-Page Link Audit - SEO Bandwagon",
  description:
    "Analyze internal and external links on any page. Check for broken links, nofollow attributes, anchor text issues, and get actionable link optimization tips.",
  keywords:
    "link analyzer, link audit, internal links, external links, broken links, nofollow, anchor text, seo tool",
};

export default function LinkAnalyzerPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Navbar />

      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-400 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Link2 className="w-4 h-4" />
            Free Tool
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            Link Analyzer
          </h1>
          <p className="text-xl text-slate-400">
            Get a detailed breakdown of every link on a page — internal,
            external, nofollow, broken, and more.
          </p>
        </div>

        {/* Tool */}
        <div className="max-w-4xl mx-auto">
          <LinkAnalyzerClient />
        </div>

        {/* SEO Content */}
        <div className="max-w-4xl mx-auto mt-16 prose prose-invert prose-slate">
          <h2>Why Analyze Your Links?</h2>
          <p>
            Links are the backbone of SEO. Internal links distribute page
            authority and help search engines understand your site structure.
            External links signal trust and relevance. Broken links waste crawl
            budget and hurt user experience.
          </p>

          <h2>What This Tool Checks</h2>
          <ul>
            <li>
              <strong>Internal vs External Links:</strong> See how your page
              links to your own site versus other domains
            </li>
            <li>
              <strong>Link Attributes:</strong> Identify nofollow, sponsored,
              and UGC rel attributes
            </li>
            <li>
              <strong>Anchor Text:</strong> Find empty or generic anchor text
              that could be optimized
            </li>
            <li>
              <strong>Backlink Profile:</strong> Domain-level backlink summary
              including referring domains and spam score
            </li>
            <li>
              <strong>Link Distribution:</strong> Understand your internal
              linking patterns at a glance
            </li>
          </ul>

          <h2>How to Use Link Data for SEO</h2>
          <p>
            Use the internal link count to ensure important pages get enough
            link equity. Check that external links use appropriate rel
            attributes. Fix any broken or empty links to improve both user
            experience and crawlability.
          </p>

          <h2>Related Tools</h2>
          <ul>
            <li>
              <a href="/tools/local-rank">Local Rank Tracker</a> — Track your
              local search rankings
            </li>
            <li>
              <a href="/tools/place-id">Place ID Finder</a> — Look up Google
              Place IDs
            </li>
            <li>
              <a href="/tools/lat-lng">Lat/Long Lookup</a> — Find coordinates
              for any address
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
