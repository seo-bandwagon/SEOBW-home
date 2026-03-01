import { auth } from "@/lib/auth";
import { WikiAnalysisClient } from "@/components/dashboard/WikiAnalysisClient";

export default async function WikiAnalysisPage() {
  const session = await auth();
  if (!session?.user) return null;

  return <WikiAnalysisClient />;
}
