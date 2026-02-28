import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Navbar } from "@/components/common/Navbar";
import { SearchConsoleClient } from "@/components/dashboard/SearchConsoleClient";

export const metadata = {
  title: "Search Console - SEO Bandwagon",
  description: "View your Google Search Console data",
};

export default async function SearchConsolePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Navbar />
      <SearchConsoleClient userEmail={session.user.email || ""} />
    </div>
  );
}
