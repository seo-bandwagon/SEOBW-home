"use client";

import { useState } from "react";
import { Bookmark, Check, Loader2 } from "lucide-react";

interface SaveSearchButtonProps {
  searchId: string | null;
  query: string;
}

export function SaveSearchButton({ searchId, query }: SaveSearchButtonProps) {
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  // Don't render if no searchId (user not logged in)
  if (!searchId) return null;

  const handleSave = async () => {
    if (status === "saving" || status === "saved") return;

    setStatus("saving");
    try {
      const res = await fetch("/api/saved-searches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ searchId, name: query }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }

      setStatus("saved");
    } catch (err) {
      console.error("Save search error:", err);
      setStatus("error");
      // Reset after a moment so they can retry
      setTimeout(() => setStatus("idle"), 2000);
    }
  };

  return (
    <button
      onClick={handleSave}
      disabled={status === "saving" || status === "saved"}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
        status === "saved"
          ? "bg-green-500/20 text-green-400 cursor-default"
          : status === "error"
          ? "bg-red-500/20 text-red-400"
          : "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
      }`}
    >
      {status === "saving" && <Loader2 className="h-4 w-4 animate-spin" />}
      {status === "saved" && <Check className="h-4 w-4" />}
      {(status === "idle" || status === "error") && <Bookmark className="h-4 w-4" />}
      {status === "idle" && "Save"}
      {status === "saving" && "Saving…"}
      {status === "saved" && "Saved"}
      {status === "error" && "Failed — Retry"}
    </button>
  );
}
