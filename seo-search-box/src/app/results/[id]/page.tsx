import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getSearchWithData } from "@/lib/db/queries";
import { Navbar } from "@/components/common/Navbar";
import { SearchBox } from "@/components/search/SearchBox";
import { ExportButton } from "@/components/common/ExportButton";
import { CachedResultsRenderer } from "@/components/results/CachedResultsRenderer";
import type { InputType } from "@/lib/parsers/inputParser";

interface CachedResultsPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Loads saved search results from the database instead of re-calling DataForSEO.
 */
export default async function CachedResultsPage({ params }: CachedResultsPageProps) {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin");
  }

  const { id } = await params;
  const search = await getSearchWithData(id);

  if (!search) {
    notFound();
  }

  const inputType = search.inputType as InputType;
  const query = search.inputValue;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto mb-8">
          <SearchBox />
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">
                Results for &quot;{query}&quot;
              </h1>
              <p className="text-slate-400 mt-1">
                Analyzing as: <span className="text-blue-400 capitalize">{inputType}</span>
                {" · "}
                <span className="text-slate-500">
                  Saved {new Date(search.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </p>
            </div>
            <ExportButton searchId={id} label="Export CSV" />
          </div>

          <CachedResultsRenderer search={search} inputType={inputType} query={query} searchId={id} />
        </div>
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
