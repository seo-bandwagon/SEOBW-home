import { Navbar } from "@/components/common/Navbar";
import { NgramAnalysisDynamic } from "@/components/dashboard/NgramAnalysisDynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const title = slug.replace(/_/g, " ");
  return {
    title: `${title} — N-gram Analysis | SEO Bandwagon`,
    description: `Content evolution analysis for Wikipedia's ${title} page. Track term frequency changes across Wayback Machine snapshots.`,
  };
}

export default async function DeepDivePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const pageName = slug.replace(/_/g, " ");
  
  return (
    <div className="min-h-screen bg-[#000022]">
      <Navbar />
      <main className="max-w-7xl mx-auto p-6 md:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">{pageName}: Content Evolution</h1>
          <p className="text-slate-400">
            N-gram analysis tracking how terminology evolved across Wayback Machine snapshots.
          </p>
          <a 
            href={`/wiki-analysis/${slug}`}
            className="text-pink hover:underline text-sm mt-2 inline-block"
          >
            ← Back to page analysis
          </a>
        </div>
        
        <NgramAnalysisDynamic slug={slug} />
        
        <div className="mt-8 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
          <h3 className="text-white font-semibold mb-2">Methodology</h3>
          <ul className="text-sm text-slate-400 space-y-1">
            <li>• Analyzed Wayback Machine snapshots from 2004-2024</li>
            <li>• Extracted main content text, removed navigation/scripts</li>
            <li>• Generated unigrams, bigrams, and trigrams</li>
            <li>• All snapshots link to original archived pages</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
