import { Navbar } from "@/components/common/Navbar";
import { WikiPageDetail } from "@/components/dashboard/WikiPageDetail";

export default function WikiPageDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  // Unwrap params synchronously via use()
  return <WikiPageDetailWrapper params={params} />;
}

async function WikiPageDetailWrapper({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <div className="min-h-screen bg-[#000022]">
      <Navbar />
      <main className="max-w-7xl mx-auto p-6 md:p-8">
        <WikiPageDetail slug={slug} />
      </main>
    </div>
  );
}
