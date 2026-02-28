import { auth } from "@/lib/auth";
import { SearchConsoleClient } from "@/components/dashboard/SearchConsoleClient";

export default async function SearchConsolePage() {
  const session = await auth();
  if (!session?.user) return null;

  return (
    <SearchConsoleClient
      userEmail={session.user.email || ""}
    />
  );
}
