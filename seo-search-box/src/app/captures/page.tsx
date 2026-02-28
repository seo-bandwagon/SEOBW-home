import { redirect } from "next/navigation";
import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { MarketingNavbar } from "@/components/common/MarketingNavbar";
import { CapturesClient } from "@/components/captures/CapturesClient";

export const metadata: Metadata = {
  title: "Page Captures - SEO Bandwagon",
  description: "View and analyze pages captured by the SEO Bandwagon browser extension.",
};

export default async function CapturesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <MarketingNavbar />
      <CapturesClient />
    </div>
  );
}
