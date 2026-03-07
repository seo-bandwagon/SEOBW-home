import { RankTrackerDashboard } from "@/components/dashboard/RankTrackerDashboard";

export const metadata = {
  title: "Rank Tracker | SEO Bandwagon",
};

export default function RankTrackerPage() {
  return <RankTrackerDashboard defaultDomain="mastercontrolpress.com" />;
}
