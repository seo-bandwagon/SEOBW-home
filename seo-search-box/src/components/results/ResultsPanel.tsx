import type { InputType } from "@/lib/parsers/inputParser";
import { KeywordResults } from "./KeywordResults";
import { DomainResults } from "./DomainResults";
import { BusinessResults } from "./BusinessResults";
import { PhoneResults } from "./PhoneResults";
import { AddressResults } from "./AddressResults";

interface ResultsPanelProps {
  query: string;
  type: InputType;
}

export async function ResultsPanel({ query, type }: ResultsPanelProps) {
  // Fetch data based on input type
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  try {
    const response = await fetch(`${baseUrl}/api/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, type }),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Search failed");
    }

    const data = await response.json();

    const searchId = data.searchId || null;

    // Render appropriate results component based on type
    switch (type) {
      case "keyword":
        return <KeywordResults data={data} query={query} searchId={searchId} />;
      case "url":
        return <DomainResults data={data} query={query} searchId={searchId} />;
      case "business":
        return <BusinessResults data={data} query={query} searchId={searchId} />;
      case "phone":
        return <PhoneResults data={data} query={query} searchId={searchId} />;
      case "address":
        return <AddressResults data={data} query={query} searchId={searchId} />;
      default:
        return <KeywordResults data={data} query={query} searchId={searchId} />;
    }
  } catch (error) {
    console.error("Error fetching results:", error);
    return (
      <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-6 text-center">
        <h3 className="text-lg font-medium text-red-400 mb-2">Search Failed</h3>
        <p className="text-slate-400">
          Unable to fetch results. Please try again later.
        </p>
      </div>
    );
  }
}
