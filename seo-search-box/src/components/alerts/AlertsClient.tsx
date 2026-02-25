"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Bell,
  BellOff,
  ArrowLeft,
  Trash2,
  RefreshCw,
  AlertCircle,
  Hash,
  Globe,
  Phone,
  Building2,
  TrendingUp,
  Link2,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AlertSearch {
  id: string;
  inputType: string;
  inputValue: string;
}

interface Alert {
  id: string;
  alertType: string;
  threshold: number | null;
  isActive: boolean;
  lastTriggered: string | null;
  createdAt: string;
  search: AlertSearch;
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

const ALERT_TYPE_META: Record<string, { label: string; icon: typeof TrendingUp; color: string }> = {
  rank_change: { label: "Rank Change", icon: TrendingUp, color: "#3b82f6" },
  traffic_change: { label: "Traffic Change", icon: BarChart3, color: "#22c55e" },
  new_backlink: { label: "New Backlink", icon: Link2, color: "#f59e0b" },
};

export function AlertsClient() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/alerts");
      if (!res.ok) throw new Error("Failed to fetch alerts");
      const data = await res.json();
      setAlerts(data.alerts || []);
    } catch (err) {
      setError("Failed to load alerts");
      console.error("Alerts fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const toggleAlert = async (alertId: string, currentActive: boolean) => {
    setTogglingIds((prev) => new Set(prev).add(alertId));
    try {
      const res = await fetch("/api/alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: alertId, isActive: !currentActive }),
      });
      if (!res.ok) throw new Error("Failed to update alert");
      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, isActive: !currentActive } : a))
      );
    } catch (err) {
      console.error("Toggle error:", err);
      setError("Failed to update alert");
    } finally {
      setTogglingIds((prev) => {
        const next = new Set(prev);
        next.delete(alertId);
        return next;
      });
    }
  };

  const deleteAlert = async (alertId: string) => {
    setDeletingIds((prev) => new Set(prev).add(alertId));
    try {
      const res = await fetch(`/api/alerts?id=${alertId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete alert");
      setAlerts((prev) => prev.filter((a) => a.id !== alertId));
    } catch (err) {
      console.error("Delete error:", err);
      setError("Failed to delete alert");
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(alertId);
        return next;
      });
    }
  };

  const activeCount = alerts.filter((a) => a.isActive).length;

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
            <h1 className="text-2xl font-bold text-white">Alerts</h1>
            <p className="text-slate-400">
              {alerts.length} {alerts.length === 1 ? "alert" : "alerts"}
              {activeCount > 0 && ` · ${activeCount} active`}
            </p>
          </div>
        </div>
        <button
          onClick={fetchAlerts}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 hover:border-slate-600 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={cn("h-4 w-4 text-slate-400", loading && "animate-spin")} />
          <span className="text-slate-300 text-sm">Refresh</span>
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <span className="text-red-400">{error}</span>
        </div>
      )}

      {/* Alerts List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-20 rounded-xl bg-slate-800/50 border border-slate-700 animate-pulse"
            />
          ))}
        </div>
      ) : alerts.length > 0 ? (
        <div className="space-y-3">
          {alerts.map((alert) => {
            const SearchIcon = TYPE_ICONS[alert.search.inputType] || Hash;
            const searchColor = TYPE_COLORS[alert.search.inputType] || "#64748b";
            const alertMeta = ALERT_TYPE_META[alert.alertType] || {
              label: alert.alertType,
              icon: Bell,
              color: "#64748b",
            };
            const AlertIcon = alertMeta.icon;
            const isToggling = togglingIds.has(alert.id);
            const isDeleting = deletingIds.has(alert.id);

            return (
              <div
                key={alert.id}
                className={cn(
                  "flex items-center justify-between p-4 rounded-xl border transition-colors",
                  alert.isActive
                    ? "bg-slate-800/50 border-slate-700"
                    : "bg-slate-800/30 border-slate-700/50 opacity-60"
                )}
              >
                <div className="flex items-center gap-4">
                  {/* Search type icon */}
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg shrink-0"
                    style={{ backgroundColor: searchColor + "20" }}
                  >
                    <SearchIcon className="h-5 w-5" style={{ color: searchColor }} />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Link
                        href={`/results/${alert.search.id}`}
                        className="font-medium text-white hover:text-blue-400 transition-colors truncate"
                      >
                        {alert.search.inputValue}
                      </Link>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span
                        className="flex items-center gap-1"
                        style={{ color: alertMeta.color }}
                      >
                        <AlertIcon className="h-3.5 w-3.5" />
                        {alertMeta.label}
                      </span>
                      {alert.threshold && (
                        <span className="text-slate-500">
                          Threshold: {alert.threshold}%
                        </span>
                      )}
                      <span className="text-slate-500">
                        Created {new Date(alert.createdAt).toLocaleDateString()}
                      </span>
                      {alert.lastTriggered && (
                        <span className="text-slate-500">
                          Last triggered{" "}
                          {new Date(alert.lastTriggered).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Toggle active */}
                  <button
                    onClick={() => toggleAlert(alert.id, alert.isActive)}
                    disabled={isToggling}
                    className={cn(
                      "p-2 rounded-lg transition-colors",
                      alert.isActive
                        ? "hover:bg-slate-700 text-green-400"
                        : "hover:bg-slate-700 text-slate-500"
                    )}
                    title={alert.isActive ? "Pause alert" : "Resume alert"}
                  >
                    {isToggling ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : alert.isActive ? (
                      <Bell className="h-4 w-4" />
                    ) : (
                      <BellOff className="h-4 w-4" />
                    )}
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => deleteAlert(alert.id)}
                    disabled={isDeleting}
                    className="p-2 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors"
                    title="Delete alert"
                  >
                    {isDeleting ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16">
          <Bell className="mx-auto h-16 w-16 text-slate-600 mb-4" />
          <h2 className="text-xl font-medium text-white mb-2">No alerts set up</h2>
          <p className="text-slate-400 mb-6">
            Create alerts from any search result to get notified about rank changes, traffic shifts, or new backlinks.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            Start Searching
          </Link>
        </div>
      )}

      {/* Info Card */}
      {alerts.length > 0 && (
        <div className="mt-8 rounded-xl bg-slate-800/30 border border-slate-700/50 p-6">
          <h3 className="text-sm font-medium text-slate-400 mb-3">Alert Types</h3>
          <div className="grid md:grid-cols-3 gap-4">
            {Object.entries(ALERT_TYPE_META).map(([key, meta]) => {
              const Icon = meta.icon;
              return (
                <div key={key} className="flex items-start gap-3">
                  <Icon className="h-5 w-5 mt-0.5 shrink-0" style={{ color: meta.color }} />
                  <div>
                    <p className="text-sm font-medium text-white">{meta.label}</p>
                    <p className="text-xs text-slate-500">
                      {key === "rank_change" && "Notifies when keyword rankings shift significantly"}
                      {key === "traffic_change" && "Notifies when organic traffic changes beyond threshold"}
                      {key === "new_backlink" && "Notifies when new backlinks are detected"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
