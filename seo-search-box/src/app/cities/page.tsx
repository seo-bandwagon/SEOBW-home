import { MarketingNavbar } from "@/components/common/MarketingNavbar";
import { Footer } from "@/components/marketing/Footer";
import { getAllCities } from "@/lib/cities-data";
import Link from "next/link";

export const metadata = {
  title: "City SEO Data | SEO Bandwagon",
  description: "Explore search data for major US cities. Keyword volumes, CPCs, and local search insights.",
};

export default function CitiesPage() {
  const cities = getAllCities();

  return (
    <div className="marketing-page">
      <MarketingNavbar />
      
      <main className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">City SEO Data</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Explore search behavior across major US cities. Real keyword data showing what people search for in each market.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cities.map((city) => (
              <Link
                key={city.slug}
                href={`/cities/${city.slug}`}
                className="block p-6 bg-white rounded-lg border border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-semibold">{city.name}</h2>
                    <p className="text-gray-500">{city.state}</p>
                  </div>
                  <span className="text-sm bg-gray-100 px-2 py-1 rounded">
                    {city.stateCode}
                  </span>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {city.keywords.length}
                    </div>
                    <div className="text-xs text-gray-500">Keywords</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {(city.totalVolume / 1000000).toFixed(1)}M
                    </div>
                    <div className="text-xs text-gray-500">Volume</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-amber-600">
                      ${city.avgCpc.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500">Avg CPC</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-12 text-center text-gray-500">
            <p>Data updated: February 2026 • Source: DataForSEO</p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
