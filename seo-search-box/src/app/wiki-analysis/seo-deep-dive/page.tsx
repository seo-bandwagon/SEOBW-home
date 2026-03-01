import { Navbar } from "@/components/common/Navbar";
import { NgramAnalysis } from "@/components/dashboard/NgramAnalysis";

export const metadata = {
  title: "SEO Wikipedia Page Deep Dive — N-gram Analysis | SEO Bandwagon",
  description: "20 years of SEO Wikipedia page content evolution. N-gram analysis tracking term frequency changes from 2004-2024 with linked Wayback Machine snapshots.",
};

export default function SeoDeepDivePage() {
  return (
    <div className="min-h-screen bg-[#000022]">
      <Navbar />
      <main className="max-w-7xl mx-auto p-6 md:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">SEO Wikipedia Page: Deep Content Analysis</h1>
          <p className="text-slate-400">
            N-gram analysis tracking how terminology evolved from 2004-2024. Click any year to view the actual Wayback Machine snapshot.
          </p>
          <a 
            href="/wiki-analysis" 
            className="text-pink hover:underline text-sm mt-2 inline-block"
          >
            ← Back to all Wikipedia pages
          </a>
        </div>
        
        <NgramAnalysis />
        
        <div className="mt-8 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
          <h3 className="text-white font-semibold mb-2">Methodology</h3>
          <ul className="text-sm text-slate-400 space-y-1">
            <li>• Analyzed 11 Wayback Machine snapshots from 2004-2024</li>
            <li>• Extracted main content text, removed navigation/scripts</li>
            <li>• Generated unigrams (single words), bigrams (2-word phrases), and trigrams (3-word phrases)</li>
            <li>• Tracked 45+ key SEO terms across all snapshots</li>
            <li>• All snapshots are linked to original archived pages</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
