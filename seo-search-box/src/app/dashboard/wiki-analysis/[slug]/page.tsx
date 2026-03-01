import { auth } from "@/lib/auth";
import { WikiPageDetail } from "@/components/dashboard/WikiPageDetail";

export default async function WikiPageDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await auth();
  if (!session?.user) return null;

  const { slug } = await params;
  return <WikiPageDetail slug={slug} />;
}
