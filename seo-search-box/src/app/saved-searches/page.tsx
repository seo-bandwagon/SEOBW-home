import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getUserSavedSearches } from "@/lib/db/queries";
import { Navbar } from "@/components/common/Navbar";
import { SavedSearchesClient } from "@/components/saved-searches/SavedSearchesClient";

export default async function SavedSearchesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  const saved = session.user.id
    ? await getUserSavedSearches(session.user.id, 100)
    : [];

  const formattedSaved = saved.map((s) => ({
    id: s.id,
    name: s.name,
    createdAt: s.createdAt.toISOString(),
    search: {
      id: s.search.id,
      inputType: s.search.inputType,
      inputValue: s.search.inputValue,
      createdAt: s.search.createdAt.toISOString(),
    },
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Navbar />
      <SavedSearchesClient savedSearches={formattedSaved} />
    </div>
  );
}
