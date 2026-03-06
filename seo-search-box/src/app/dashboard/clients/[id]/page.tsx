import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ClientReport } from "@/components/dashboard/ClientReport";

export const metadata = {
  title: "Client Report — SEO Bandwagon",
};

export default async function ClientReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin");
  }

  const { id } = await params;
  return <ClientReport clientId={id} userEmail={session.user.email || ""} />;
}
