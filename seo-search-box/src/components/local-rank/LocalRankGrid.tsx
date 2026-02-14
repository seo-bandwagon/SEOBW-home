"use client";

import { useMemo } from "react";
import type { GridScanSummary } from "@/lib/dataforseo";

interface LocalRankGridProps {
  data: GridScanSummary;
}

function getRankColor(rank: number | null): string {
  if (rank === null) return "bg-slate-700 text-slate-400"; // Not ranked
  if (rank <= 3) return "bg-green-500 text-white"; // Top 3
  if (rank <= 10) return "bg-yellow-500 text-black"; // Top 10
  return "bg-red-500 text-white"; // 11+
}

function getRankDisplay(rank: number | null): string {
  if (rank === null) return "×";
  return rank.toString();
}

export function LocalRankGrid({ data }: LocalRankGridProps) {
  const grid = useMemo(() => {
    // Create 2D grid array
    const gridArray: Array<Array<(typeof data.results)[0] | null>> = Array(
      data.gridSize
    )
      .fill(null)
      .map(() => Array(data.gridSize).fill(null));

    for (const result of data.results) {
      gridArray[result.row][result.col] = result;
    }

    return gridArray;
  }, [data]);

  return (
    <div className="bg-slate-800 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">
        Local Rank Map
      </h3>

      {/* Grid */}
      <div
        className="grid gap-2 mb-6"
        style={{
          gridTemplateColumns: `repeat(${data.gridSize}, minmax(0, 1fr))`,
        }}
      >
        {grid.map((row, rowIndex) =>
          row.map((cell, colIndex) => {
            const isCenter =
              rowIndex === Math.floor(data.gridSize / 2) &&
              colIndex === Math.floor(data.gridSize / 2);

            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`
                  aspect-square flex items-center justify-center rounded-lg text-lg font-bold
                  ${getRankColor(cell?.rank ?? null)}
                  ${isCenter ? "ring-2 ring-pink-500 ring-offset-2 ring-offset-slate-800" : ""}
                  transition-transform hover:scale-105 cursor-default
                `}
                title={
                  cell
                    ? `Rank: ${cell.rank ?? "Not in top 20"}\nTop result: ${cell.topResult || "N/A"}`
                    : "No data"
                }
              >
                {getRankDisplay(cell?.rank ?? null)}
              </div>
            );
          })
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-sm">
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-green-500"></div>
          <span className="text-slate-400">1-3</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-yellow-500"></div>
          <span className="text-slate-400">4-10</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-red-500"></div>
          <span className="text-slate-400">11-20</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-slate-700"></div>
          <span className="text-slate-400">Not ranked</span>
        </div>
      </div>
    </div>
  );
}

export function LocalRankStats({ data }: LocalRankGridProps) {
  return (
    <div className="bg-slate-800 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">
        Summary
      </h3>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-700/50 rounded-lg p-4">
          <div className="text-3xl font-bold text-white">
            {data.stats.averageRank ?? "—"}
          </div>
          <div className="text-sm text-slate-400">Average Rank</div>
        </div>

        <div className="bg-slate-700/50 rounded-lg p-4">
          <div className="text-3xl font-bold text-white">
            {data.stats.visibilityPercent}%
          </div>
          <div className="text-sm text-slate-400">Visibility</div>
        </div>

        <div className="bg-slate-700/50 rounded-lg p-4">
          <div className="text-3xl font-bold text-green-400">
            {data.stats.top3Count}/{data.stats.totalPoints}
          </div>
          <div className="text-sm text-slate-400">Top 3 Positions</div>
        </div>

        <div className="bg-slate-700/50 rounded-lg p-4">
          <div className="text-3xl font-bold text-yellow-400">
            {data.stats.top10Count}/{data.stats.totalPoints}
          </div>
          <div className="text-sm text-slate-400">Top 10 Positions</div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-700">
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Grid Size</span>
          <span className="text-white">{data.gridSize}×{data.gridSize}</span>
        </div>
        <div className="flex justify-between text-sm mt-2">
          <span className="text-slate-400">Radius</span>
          <span className="text-white">{data.radiusMiles} miles</span>
        </div>
        <div className="flex justify-between text-sm mt-2">
          <span className="text-slate-400">API Cost</span>
          <span className="text-white">${data.cost.toFixed(3)}</span>
        </div>
      </div>
    </div>
  );
}

export function LocalRankDetails({ data }: LocalRankGridProps) {
  return (
    <div className="bg-slate-800 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">
        Scan Details
      </h3>

      <dl className="space-y-3">
        <div>
          <dt className="text-sm text-slate-400">Keyword</dt>
          <dd className="text-white font-medium">&quot;{data.keyword}&quot;</dd>
        </div>
        <div>
          <dt className="text-sm text-slate-400">Business</dt>
          <dd className="text-white font-medium">{data.business}</dd>
        </div>
        {data.placeId && (
          <div>
            <dt className="text-sm text-slate-400">Place ID</dt>
            <dd className="text-white font-mono text-xs break-all">
              {data.placeId}
            </dd>
          </div>
        )}
        <div>
          <dt className="text-sm text-slate-400">Center Coordinates</dt>
          <dd className="text-white font-mono text-sm">
            {data.centerLat.toFixed(6)}, {data.centerLng.toFixed(6)}
          </dd>
        </div>
      </dl>
    </div>
  );
}
