import { auth } from "@/lib/auth";
import { SiteHealthClient } from "@/components/dashboard/SiteHealthClient";

export default async function SiteHealthPage() {
  const session = await auth();
  if (!session?.user) return null;

  return <SiteHealthClient />;
}
