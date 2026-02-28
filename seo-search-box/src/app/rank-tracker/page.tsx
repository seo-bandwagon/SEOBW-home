import { Metadata } from "next";
import { RankTrackerClient } from "@/components/rank-tracker/RankTrackerClient";

export const metadata: Metadata = {
  title: "Rank Tracker - SEO Bandwagon",
  description:
    "Check where your website ranks in Google for any keyword. Track your position over time.",
};

export default function RankTrackerPage() {
  return (
    <main className="min-h-screen bg-[#000022] pt-8 pb-20">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="text-center mb-10">
          <h1 className="font-heading text-4xl md:text-5xl text-[#F5F5F5] tracking-wider mb-3">
            RANK TRACKER
          </h1>
          <p className="text-[#F5F5F5]/60 text-lg max-w-2xl mx-auto">
            Check where your site ranks in Google for any keyword. Track
            position changes over time.
          </p>
        </div>
        <RankTrackerClient />
      </div>
    </main>
  );
}
