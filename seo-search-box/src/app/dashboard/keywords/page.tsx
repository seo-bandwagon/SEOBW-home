import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { KeywordDashboard } from "@/components/dashboard/KeywordDashboard";

export const metadata = {
  title: "Keyword Tracker — SEO Bandwagon",
  description: "Track your keyword rankings across all your domains",
};

export default async function KeywordDashboardPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/auth/signin");
  }

  return <KeywordDashboard />;
}
