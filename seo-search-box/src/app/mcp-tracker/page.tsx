import { Metadata } from "next";
import { MarketingNavbar } from "@/components/common/MarketingNavbar";
import { MCPTrackerClient } from "@/components/mcp-tracker/MCPTrackerClient";

export const metadata: Metadata = {
  title: "MCP Rankings Tracker - SEO Bandwagon",
  description: "Live keyword rankings for mastercontrolpress.com. Public proof that our SEO actually works.",
};

export default function MCPTrackerPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <MarketingNavbar />
      <MCPTrackerClient />
    </div>
  );
}
