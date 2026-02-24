"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Clock,
  Search,
  Globe,
  Phone,
  Building2,
  Hash,
  ArrowLeft,
  Filter,
  Trash2,
  Download,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchRecord {
  id: string;
  inputType: string;
  inputValue: string;
  normalizedValue: string | null;
  createdAt: string;
}

interface HistoryClientProps {
  searches: SearchRecord[];
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

export function HistoryClient({ searches }: HistoryClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Get unique types from searches
  const availableTypes = useMemo(() => {
    const types = new Set(searches.map((s) => s.inputType));
    return Array.from(types);
  }, [searches]);

  // Filter searches based on query and types
  const filteredSearches = useMemo(() => {
    return searches.filter((search) => {
      const matchesQuery =
        searchQuery === "" ||
        search.inputValue.toLowerCase().includes(searchQuery.toLowerCase()) ||
        search.normalizedValue?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType =
        selectedTypes.length === 0 || selectedTypes.includes(search.inputType);

      return matchesQuery && matchesType;
    });
  }, [searches, searchQuery, selectedTypes]);

  // Group searches by date
  const groupedSearches = useMemo(() => {
    const groups: Record<string, SearchRecord[]> = {};

    filteredSearches.forEach((search) => {
      const date = new Date(search.createdAt);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let key: string;
      if (date.toDateString() === today.toDateString()) {
        key = "Today";
      } else if (date.toDateString() === yesterday.toDateString()) {
        key = "Yesterday";
      } else {
        key = date.toLocaleDateString("en-US", {
          weekday: "long",
          month: "short",
          day: "numeric",
        });
      }

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(search);
    });

    return groups;
  }, [filteredSearches]);

  const toggleType = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedTypes([]);
  };

  const exportToCSV = () => {
    const headers = ["Type", "Value", "Date"];
    const rows = filteredSearches.map((s) => [
      s.inputType,
      s.inputValue,
      new Date(s.createdAt).toISOString(),
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `search-history-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const hasActiveFilters = searchQuery !== "" || selectedTypes.length > 0;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-slate-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Search History</h1>
            <p className="text-slate-400">
              {filteredSearches.length} {filteredSearches.length === 1 ? "search" : "searches"}
              {hasActiveFilters && " (filtered)"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportToCSV}
            disabled={filteredSearches.length === 0}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 hover:border-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="h-4 w-4 text-slate-400" />
            <span className="text-sm text-slate-300">Export</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
            <input
              type="text"
              placeholder="Search your history..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-slate-700"
              >
                <X className="h-4 w-4 text-slate-500" />
              </button>
            )}
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "flex items-center gap-2 px-4 py-3 rounded-xl border transition-colors",
              showFilters || selectedTypes.length > 0
                ? "bg-blue-600/20 border-blue-500/50 text-blue-400"
                : "bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600"
            )}
          >
            <Filter className="h-5 w-5" />
            <span className="hidden sm:inline">Filter</span>
            {selectedTypes.length > 0 && (
              <span className="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded">
                {selectedTypes.length}
              </span>
            )}
          </button>
        </div>

        {/* Filter Pills */}
        {showFilters && (
          <div className="flex flex-wrap gap-2 p-4 rounded-xl bg-slate-800/50 border border-slate-700">
            <span className="text-sm text-slate-400 mr-2">Type:</span>
            {availableTypes.map((type) => {
              const Icon = TYPE_ICONS[type] || Hash;
              const isSelected = selectedTypes.includes(type);
              return (
                <button
                  key={type}
                  onClick={() => toggleType(type)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors",
                    isSelected
                      ? "bg-blue-600/20 border border-blue-500/50 text-blue-400"
                      : "bg-slate-700/50 border border-slate-600 text-slate-300 hover:border-slate-500"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {TYPE_LABELS[type] || type}
                </button>
              );
            })}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="ml-auto flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
                Clear all
              </button>
            )}
          </div>
        )}
      </div>

      {/* Search History List */}
      {filteredSearches.length > 0 ? (
        <div className="space-y-8">
          {Object.entries(groupedSearches).map(([date, dateSearches]) => (
            <div key={date}>
              <h3 className="text-sm font-medium text-slate-500 mb-3 sticky top-0 bg-slate-900 py-2">
                {date}
              </h3>
              <div className="space-y-2">
                {dateSearches.map((search) => {
                  const Icon = TYPE_ICONS[search.inputType] || Hash;
                  const color = TYPE_COLORS[search.inputType] || "#64748b";
                  return (
                    <Link
                      key={search.id}
                      href={`/results/${search.id}`}
                      className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-slate-600 transition-colors group"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-lg"
                          style={{ backgroundColor: color + "20" }}
                        >
                          <Icon className="h-5 w-5" style={{ color }} />
                        </div>
                        <div>
                          <p className="font-medium text-white group-hover:text-blue-400 transition-colors">
                            {search.inputValue}
                          </p>
                          <p className="text-sm text-slate-500">
                            <span
                              className="capitalize"
                              style={{ color: color + "99" }}
                            >
                              {TYPE_LABELS[search.inputType] || search.inputType}
                            </span>
                            {" · "}
                            {new Date(search.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                      <Search className="h-5 w-5 text-slate-600 group-hover:text-slate-400 transition-colors" />
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : searches.length > 0 ? (
        <div className="text-center py-16">
          <Search className="mx-auto h-16 w-16 text-slate-600 mb-4" />
          <h2 className="text-xl font-medium text-white mb-2">No matches found</h2>
          <p className="text-slate-400 mb-6">
            Try adjusting your search or filters
          </p>
          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-slate-800 text-white hover:bg-slate-700 transition-colors"
          >
            <X className="h-5 w-5" />
            Clear filters
          </button>
        </div>
      ) : (
        <div className="text-center py-16">
          <Clock className="mx-auto h-16 w-16 text-slate-600 mb-4" />
          <h2 className="text-xl font-medium text-white mb-2">No search history</h2>
          <p className="text-slate-400 mb-6">
            Your search history will appear here once you start searching
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
