import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getUserSearches, getUserSavedSearches } from "@/lib/db/queries";
import { Navbar } from "@/components/common/Navbar";
import { DashboardClient } from "@/components/dashboard/DashboardClient";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  // Fetch initial data server-side
  const [recentSearches, savedSearches] = await Promise.all([
    session.user.id ? getUserSearches(session.user.id, 10, 0) : Promise.resolve([]),
    session.user.id ? getUserSavedSearches(session.user.id, 100) : Promise.resolve([]),
  ]);

  // Transform searches for the client component
  const formattedSearches = recentSearches.map((search) => ({
    id: search.id,
    inputType: search.inputType,
    inputValue: search.inputValue,
    createdAt: search.createdAt.toISOString(),
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Navbar />
      <DashboardClient
        user={{
          name: session.user.name || "User",
          email: session.user.email || "",
          image: session.user.image || null,
        }}
        recentSearches={formattedSearches}
        savedSearchCount={savedSearches.length}
      />
    </div>
  );
}
