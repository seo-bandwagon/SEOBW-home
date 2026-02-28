import { auth } from "@/lib/auth";
import { getUserSearches, getUserSavedSearches } from "@/lib/db/queries";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";

export default async function DashboardPage() {
  const session = await auth();

  // Layout handles auth redirect, but guard anyway
  if (!session?.user) return null;

  const [recentSearches, savedSearches] = await Promise.all([
    session.user.id
      ? getUserSearches(session.user.id, 10, 0)
      : Promise.resolve([]),
    session.user.id
      ? getUserSavedSearches(session.user.id, 100)
      : Promise.resolve([]),
  ]);

  const formattedSearches = recentSearches.map((search) => ({
    id: search.id,
    inputType: search.inputType,
    inputValue: search.inputValue,
    createdAt: search.createdAt.toISOString(),
  }));

  return (
    <DashboardOverview
      user={{
        name: session.user.name || undefined,
        email: session.user.email || undefined,
        image: session.user.image || undefined,
      }}
      recentSearches={formattedSearches}
      savedSearchCount={savedSearches.length}
    />
  );
}
