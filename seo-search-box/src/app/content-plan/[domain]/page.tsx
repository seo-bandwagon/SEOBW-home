import { Metadata } from "next";
import { Navbar } from "@/components/common/Navbar";
import { ContentPlanClient } from "@/components/content-plan/ContentPlanClient";

interface Props {
  params: { domain: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { domain } = params;
  return {
    title: `Content Plan: ${domain} - SEO Bandwagon`,
    description: `Content plan and keyword strategy for ${domain}.`,
  };
}

export default function ContentPlanPage({ params }: Props) {
  const { domain } = params;

  return (
    <div className="min-h-screen bg-[#000022]">
      <Navbar />
      <main className="pt-8 pb-20">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="text-center mb-10">
            <h1 className="font-heading text-4xl md:text-5xl text-[#F5F5F5] tracking-wider mb-3">
              CONTENT PLAN — {domain}
            </h1>
            <p className="text-[#F5F5F5]/60 text-lg max-w-2xl mx-auto">
              Keyword strategy, expected traffic, and content gaps for {domain}.
            </p>
          </div>
          <ContentPlanClient domain={domain} />
        </div>
      </main>
    </div>
  );
}
