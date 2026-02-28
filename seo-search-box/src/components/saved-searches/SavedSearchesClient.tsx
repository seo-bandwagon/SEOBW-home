"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bookmark,
  Hash,
  Globe,
  Phone,
  Building2,
  ArrowLeft,
  Trash2,
  Search,
} from "lucide-react";

interface SavedSearch {
  id: string;
  name: string | null;
  createdAt: string;
  search: {
    id: string;
    inputType: string;
    inputValue: string;
    createdAt: string;
  };
}

interface SavedSearchesClientProps {
  savedSearches: SavedSearch[];
}

const TYPE_ICONS: Record<string, typeof Hash> = {
  keyword: Hash,
  url: Globe,
  phone: Phone,
  business: Building2,
};

const TYPE_COLORS: Record<string, string> = {
  keyword: "#3b82f6",
  url: "#22c55e",
  phone: "#f59e0b",
  business: "#8b5cf6",
};

const TYPE_LABELS: Record<string, string> = {
  keyword: "Keyword",
  url: "URL",
  phone: "Phone",
  business: "Business",
};

export function SavedSearchesClient({ savedSearches: initial }: SavedSearchesClientProps) {
  const [savedSearches, setSavedSearches] = useState(initial);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (deleting) return;
    setDeleting(id);

    try {
      const res = await fetch(`/api/saved-searches?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setSavedSearches((prev) => prev.filter((s) => s.id !== id));
      }
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/dashboard"
          className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-slate-400" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Saved Searches</h1>
          <p className="text-slate-400">
            {savedSearches.length} saved {savedSearches.length === 1 ? "search" : "searches"}
          </p>
        </div>
      </div>

      {/* Saved Searches List */}
      {savedSearches.length > 0 ? (
        <div className="space-y-2">
          {savedSearches.map((saved) => {
            const Icon = TYPE_ICONS[saved.search.inputType] || Hash;
            const color = TYPE_COLORS[saved.search.inputType] || "#64748b";
            return (
              <div
                key={saved.id}
                className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-slate-600 transition-colors group"
              >
                <Link
                  href={`/results/${saved.search.id}`}
                  className="flex items-center gap-4 flex-1 min-w-0"
                >
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg flex-shrink-0"
                    style={{ backgroundColor: color + "20" }}
                  >
                    <Icon className="h-5 w-5" style={{ color }} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-white group-hover:text-blue-400 transition-colors truncate">
                      {saved.name || saved.search.inputValue}
                    </p>
                    <p className="text-sm text-slate-500">
                      <span className="capitalize" style={{ color: color + "99" }}>
                        {TYPE_LABELS[saved.search.inputType] || saved.search.inputType}
                      </span>
                      {" · Saved "}
                      {new Date(saved.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </Link>

                <button
                  onClick={() => handleDelete(saved.id)}
                  disabled={deleting === saved.id}
                  className="p-2 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                  title="Remove from saved"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16">
          <Bookmark className="mx-auto h-16 w-16 text-slate-600 mb-4" />
          <h2 className="text-xl font-medium text-white mb-2">No saved searches</h2>
          <p className="text-slate-400 mb-6">
            Save searches from the results page to quickly access them later
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            <Search className="h-5 w-5" />
            Start Searching
          </Link>
        </div>
      )}
    </div>
  );
}
