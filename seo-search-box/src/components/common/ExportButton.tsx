"use client";

import { useState } from "react";
import { Download, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExportButtonProps {
  /** Single search ID to export */
  searchId?: string;
  /** If true, exports all user history */
  bulk?: boolean;
  /** Max results for bulk export */
  limit?: number;
  /** Button label */
  label?: string;
  /** Additional class names */
  className?: string;
  /** Compact mode (icon only) */
  compact?: boolean;
}

export function ExportButton({
  searchId,
  bulk,
  limit = 500,
  label = "Export CSV",
  className,
  compact = false,
}: ExportButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      let url = "/api/export";
      if (searchId) {
        url += `?id=${searchId}`;
      } else if (bulk) {
        url += `?bulk=true&limit=${limit}`;
      } else {
        return;
      }

      const res = await fetch(url);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Export failed" }));
        throw new Error(err.error || "Export failed");
      }

      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition");
      const filenameMatch = disposition?.match(/filename="?([^"]+)"?/);
      const filename = filenameMatch?.[1] || "export.csv";

      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (err) {
      console.error("Export error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (compact) {
    return (
      <button
        onClick={handleExport}
        disabled={loading}
        className={cn(
          "p-2 rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50",
          className
        )}
        title={label}
      >
        {loading ? (
          <RefreshCw className="h-4 w-4 text-slate-400 animate-spin" />
        ) : (
          <Download className="h-4 w-4 text-slate-400" />
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 hover:border-slate-600 transition-colors disabled:opacity-50",
        className
      )}
    >
      {loading ? (
        <RefreshCw className="h-4 w-4 text-slate-400 animate-spin" />
      ) : (
        <Download className="h-4 w-4 text-slate-400" />
      )}
      <span className="text-sm text-slate-300">{label}</span>
    </button>
  );
}
