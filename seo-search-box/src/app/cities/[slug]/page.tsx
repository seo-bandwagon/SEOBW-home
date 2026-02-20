import { MarketingNavbar } from "@/components/common/MarketingNavbar";
import { Footer } from "@/components/marketing/Footer";
import { getCityBySlug, getAllCitySlugs } from "@/lib/cities-data";
import { notFound } from "next/navigation";
import Link from "next/link";

interface PageProps {
  params: { slug: string };
}

export async function generateStaticParams() {
  return getAllCitySlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const city = getCityBySlug(params.slug);
  if (!city) return { title: "City Not Found" };

  return {
    title: `${city.name}, ${city.stateCode} SEO Data | SEO Bandwagon`,
    description: `Search data for ${city.name}, ${city.state}. ${city.keywords.length} keywords analyzed with ${(city.totalVolume / 1000000).toFixed(1)}M total monthly searches.`,
  };
}

export default function CityPage({ params }: PageProps) {
  const city = getCityBySlug(params.slug);

  if (!city) {
    notFound();
  }

  const topKeywords = city.keywords.slice(0, 50);
  const highCpcKeywords = [...city.keywords]
    .sort((a, b) => b.cpc - a.cpc)
    .slice(0, 10);

  return (
    <div className="marketing-page">
      <MarketingNavbar />

      <main className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          {/* Breadcrumb */}
          <nav className="mb-8 text-sm">
            <Link href="/cities" className="text-blue-600 hover:underline">
              Cities
            </Link>
            <span className="mx-2 text-gray-400">/</span>
            <span className="text-gray-600">{city.name}</span>
          </nav>

          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold mb-2">
              {city.name}, {city.stateCode}
            </h1>
            <p className="text-xl text-gray-600">
              Search behavior insights for {city.name}, {city.state}
            </p>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-4 gap-6 mb-12">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="text-3xl font-bold text-blue-600">
                {city.keywords.length}
              </div>
              <div className="text-gray-500">Keywords Analyzed</div>
            </div>
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="text-3xl font-bold text-green-600">
                {(city.totalVolume / 1000000).toFixed(2)}M
              </div>
              <div className="text-gray-500">Monthly Searches</div>
            </div>
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="text-3xl font-bold text-amber-600">
                ${city.avgCpc.toFixed(2)}
              </div>
              <div className="text-gray-500">Average CPC</div>
            </div>
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="text-3xl font-bold text-purple-600">
                {city.dataDate}
              </div>
              <div className="text-gray-500">Data Updated</div>
            </div>
          </div>

          {/* High Value Keywords */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">💰 Highest Value Keywords</h2>
            <p className="text-gray-600 mb-4">
              Keywords with the highest cost-per-click indicate strong commercial intent.
            </p>
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                      Keyword
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">
                      Volume
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">
                      CPC
                    </th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                      Competition
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {highCpcKeywords.map((kw, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium">
                        {kw.keyword}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-gray-600">
                        {kw.volume.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-right font-semibold text-green-600">
                        ${kw.cpc.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`px-2 py-1 text-xs rounded ${
                            kw.competition === "HIGH"
                              ? "bg-red-100 text-red-700"
                              : kw.competition === "MEDIUM"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {kw.competition}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Top Keywords by Volume */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">📊 Top Keywords by Volume</h2>
            <p className="text-gray-600 mb-4">
              The most searched terms related to {city.name}.
            </p>
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                      Keyword
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">
                      Volume
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">
                      CPC
                    </th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                      Competition
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {topKeywords.map((kw, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium">
                        {kw.keyword}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-gray-600">
                        {kw.volume.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-gray-600">
                        ${kw.cpc.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`px-2 py-1 text-xs rounded ${
                            kw.competition === "HIGH"
                              ? "bg-red-100 text-red-700"
                              : kw.competition === "MEDIUM"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {kw.competition}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* CTA */}
          <section className="bg-blue-50 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">
              Want to rank for these keywords in {city.name}?
            </h2>
            <p className="text-gray-600 mb-6">
              Get a free SEO audit and see how your site stacks up against the competition.
            </p>
            <Link
              href="/#scan"
              className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Free SEO Audit →
            </Link>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
