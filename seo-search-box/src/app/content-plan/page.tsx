import { Metadata } from "next";
import { Navbar } from "@/components/common/Navbar";
import { ContentPlanClient } from "@/components/content-plan/ContentPlanClient";

export const metadata: Metadata = {
  title: "Content Plan - SEO Bandwagon",
  description: "Content plan and keyword strategy for managed domains.",
};

export default function ContentPlanPage() {
  return (
    <div className="min-h-screen bg-[#000022]">
      <Navbar />
      <main className="pt-8 pb-20">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="text-center mb-10">
            <h1 className="font-heading text-4xl md:text-5xl text-[#F5F5F5] tracking-wider mb-3">
              CONTENT PLAN
            </h1>
            <p className="text-[#F5F5F5]/60 text-lg max-w-2xl mx-auto">
              Keyword strategy, expected traffic, and content gaps for mastercontrolpress.com.
            </p>
          </div>
          <ContentPlanClient />
        </div>
      </main>
    </div>
  );
}
