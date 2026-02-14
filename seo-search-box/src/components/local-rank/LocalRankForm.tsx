"use client";

import { useState } from "react";
import { Loader2, MapPin, Search, Building2 } from "lucide-react";

interface LocalRankFormProps {
  onSubmit: (data: LocalRankFormData) => void;
  isLoading?: boolean;
}

export interface LocalRankFormData {
  keyword: string;
  businessName: string;
  location: string;
  gridSize: number;
  radiusMiles: number;
}

export function LocalRankForm({ onSubmit, isLoading }: LocalRankFormProps) {
  const [keyword, setKeyword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [location, setLocation] = useState("");
  const [gridSize, setGridSize] = useState(5);
  const [radiusMiles, setRadiusMiles] = useState(5);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim() || !businessName.trim() || !location.trim()) return;

    onSubmit({
      keyword: keyword.trim(),
      businessName: businessName.trim(),
      location: location.trim(),
      gridSize,
      radiusMiles,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Keyword */}
      <div>
        <label htmlFor="keyword" className="block text-sm font-medium text-slate-300 mb-2">
          <Search className="inline-block w-4 h-4 mr-1" />
          Search Keyword
        </label>
        <input
          id="keyword"
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="e.g., plumber, dentist, pizza"
          disabled={isLoading}
          className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent disabled:opacity-50"
        />
        <p className="mt-1 text-xs text-slate-400">
          The keyword customers search for to find this type of business
        </p>
      </div>

      {/* Business Name */}
      <div>
        <label htmlFor="businessName" className="block text-sm font-medium text-slate-300 mb-2">
          <Building2 className="inline-block w-4 h-4 mr-1" />
          Business Name
        </label>
        <input
          id="businessName"
          type="text"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          placeholder="e.g., Joe's Plumbing, Seattle Dental"
          disabled={isLoading}
          className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent disabled:opacity-50"
        />
      </div>

      {/* Location */}
      <div>
        <label htmlFor="location" className="block text-sm font-medium text-slate-300 mb-2">
          <MapPin className="inline-block w-4 h-4 mr-1" />
          Location
        </label>
        <input
          id="location"
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="e.g., Seattle, WA or 98101"
          disabled={isLoading}
          className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent disabled:opacity-50"
        />
      </div>

      {/* Grid Options */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="gridSize" className="block text-sm font-medium text-slate-300 mb-2">
            Grid Size
          </label>
          <select
            id="gridSize"
            value={gridSize}
            onChange={(e) => setGridSize(parseInt(e.target.value, 10))}
            disabled={isLoading}
            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent disabled:opacity-50"
          >
            <option value={3}>3×3 (9 points)</option>
            <option value={5}>5×5 (25 points)</option>
            <option value={7}>7×7 (49 points)</option>
          </select>
        </div>

        <div>
          <label htmlFor="radiusMiles" className="block text-sm font-medium text-slate-300 mb-2">
            Radius (miles)
          </label>
          <select
            id="radiusMiles"
            value={radiusMiles}
            onChange={(e) => setRadiusMiles(parseInt(e.target.value, 10))}
            disabled={isLoading}
            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent disabled:opacity-50"
          >
            <option value={2}>2 miles</option>
            <option value={5}>5 miles</option>
            <option value={10}>10 miles</option>
            <option value={15}>15 miles</option>
          </select>
        </div>
      </div>

      {/* Estimated Cost */}
      <div className="bg-slate-700/50 rounded-lg p-4 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-400">Estimated API cost:</span>
          <span className="text-white font-mono">
            ${(gridSize * gridSize * 0.002).toFixed(3)}
          </span>
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-slate-400">Estimated time:</span>
          <span className="text-white font-mono">
            ~{Math.ceil((gridSize * gridSize * 3) / 60)} min
          </span>
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={!keyword.trim() || !businessName.trim() || !location.trim() || isLoading}
        className="w-full py-4 px-6 bg-pink-500 hover:bg-pink-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Scanning {gridSize * gridSize} points...
          </>
        ) : (
          <>
            <MapPin className="w-5 h-5" />
            Check Local Rankings
          </>
        )}
      </button>
    </form>
  );
}
