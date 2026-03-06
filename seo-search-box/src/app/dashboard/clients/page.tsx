import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ClientsManager } from "@/components/dashboard/ClientsManager";

export const metadata = {
  title: "Clients — SEO Bandwagon",
  description: "Manage your SEO clients and their reporting",
};

export default async function ClientsPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/auth/signin");
  }

  return <ClientsManager />;
}
