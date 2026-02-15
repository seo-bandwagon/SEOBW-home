"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, Globe, Phone, Building2, Hash, MapPin } from "lucide-react";
import { parseInput, type InputType, type ParsedInput } from "@/lib/parsers/inputParser";
import { useAutocomplete } from "@/lib/hooks/useAutocomplete";
import { cn } from "@/lib/utils";

const INPUT_TYPE_CONFIG: Record<InputType, { icon: typeof Search; label: string; color: string; bgColor: string }> = {
  keyword: {
    icon: Hash,
    label: "Keyword",
    color: "text-blue-400",
    bgColor: "bg-blue-500/20",
  },
  url: {
    icon: Globe,
    label: "URL/Domain",
    color: "text-green-400",
    bgColor: "bg-green-500/20",
  },
  phone: {
    icon: Phone,
    label: "Phone Number",
    color: "text-purple-400",
    bgColor: "bg-purple-500/20",
  },
  address: {
    icon: MapPin,
    label: "Address",
    color: "text-pink-400",
    bgColor: "bg-pink-500/20",
  },
  business: {
    icon: Building2,
    label: "Business Name",
    color: "text-orange-400",
    bgColor: "bg-orange-500/20",
  },
};

export function SearchBox() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [parsedInput, setParsedInput] = useState<ParsedInput | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  const { predictions, isLoading: isLoadingSuggestions, resetSession } = useAutocomplete(query, {
    minLength: 3,
    debounceMs: 250,
  });

  // Debounced input parsing
  useEffect(() => {
    if (query.trim().length >= 2) {
      const parsed = parseInput(query);
      setParsedInput(parsed);
    } else {
      setParsedInput(null);
    }
  }, [query]);

  // Show suggestions when we have predictions and input is focused
  useEffect(() => {
    setShowSuggestions(isFocused && predictions.length > 0);
    setSelectedIndex(-1);
  }, [isFocused, predictions]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!query.trim() || isLoading) return;

      setIsLoading(true);
      setShowSuggestions(false);

      try {
        const parsed = parseInput(query);

        // Navigate to results page with query params
        const params = new URLSearchParams({
          q: parsed.normalized || query,
          type: parsed.type,
        });

        const newUrl = `/results?${params.toString()}`;
        
        // Use replace + refresh to ensure results update even when already on results page
        router.replace(newUrl);
        router.refresh();
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [query, isLoading, router]
  );

  const handleSelectSuggestion = useCallback(
    (suggestion: typeof predictions[0]) => {
      setQuery(suggestion.mainText);
      setShowSuggestions(false);
      resetSession();
      inputRef.current?.focus();
    },
    [resetSession]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!showSuggestions || predictions.length === 0) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < predictions.length - 1 ? prev + 1 : prev
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
          break;
        case "Enter":
          if (selectedIndex >= 0) {
            e.preventDefault();
            handleSelectSuggestion(predictions[selectedIndex]);
          }
          break;
        case "Escape":
          setShowSuggestions(false);
          setSelectedIndex(-1);
          break;
      }
    },
    [showSuggestions, predictions, selectedIndex, handleSelectSuggestion]
  );

  const typeConfig = parsedInput ? INPUT_TYPE_CONFIG[parsedInput.type] : null;
  const TypeIcon = typeConfig?.icon || Search;

  return (
    <form onSubmit={handleSubmit} className="relative">
      {/* Main Search Input */}
      <div
        className={cn(
          "relative flex items-center rounded-2xl border-2 bg-slate-800/50 transition-all duration-200",
          isFocused
            ? "border-blue-500 shadow-lg shadow-blue-500/20"
            : "border-slate-700 hover:border-slate-600"
        )}
      >
        {/* Input Type Indicator */}
        <div className="flex items-center pl-4">
          {parsedInput && parsedInput.confidence >= 0.7 ? (
            <div
              className={cn(
                "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-all",
                typeConfig?.bgColor,
                typeConfig?.color
              )}
            >
              <TypeIcon className="h-3.5 w-3.5" />
              <span>{typeConfig?.label}</span>
            </div>
          ) : (
            <Search className="h-5 w-5 text-slate-400" />
          )}
        </div>

        {/* Input Field */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setTimeout(() => setIsFocused(false), 200);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Enter keyword, URL, business name, or phone number..."
          className="flex-1 bg-transparent px-4 py-4 text-lg text-white placeholder-slate-500 outline-none"
          disabled={isLoading}
        />

        {/* Search Button */}
        <button
          type="submit"
          disabled={!query.trim() || isLoading}
          className={cn(
            "mr-2 flex items-center gap-2 rounded-xl px-6 py-3 font-medium transition-all",
            query.trim() && !isLoading
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-slate-700 text-slate-400 cursor-not-allowed"
          )}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Searching...</span>
            </>
          ) : (
            <>
              <Search className="h-5 w-5" />
              <span>Search</span>
            </>
          )}
        </button>
      </div>

      {/* Autocomplete Suggestions */}
      {showSuggestions && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50">
          {isLoadingSuggestions && predictions.length === 0 ? (
            <div className="px-4 py-3 text-slate-400 text-sm flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading suggestions...
            </div>
          ) : (
            <ul className="py-2">
              {predictions.map((prediction, index) => {
                const isAddress =
                  prediction.types.includes("geocode") ||
                  prediction.types.includes("street_address");
                const Icon = isAddress ? MapPin : Building2;

                return (
                  <li key={prediction.placeId}>
                    <button
                      type="button"
                      onClick={() => handleSelectSuggestion(prediction)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={cn(
                        "w-full px-4 py-3 flex items-start gap-3 text-left transition-colors",
                        index === selectedIndex
                          ? "bg-blue-500/20"
                          : "hover:bg-slate-700/50"
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-5 w-5 mt-0.5 flex-shrink-0",
                          isAddress ? "text-pink-400" : "text-orange-400"
                        )}
                      />
                      <div className="min-w-0">
                        <div className="text-white font-medium truncate">
                          {prediction.mainText}
                        </div>
                        {prediction.secondaryText && (
                          <div className="text-slate-400 text-sm truncate">
                            {prediction.secondaryText}
                          </div>
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {/* Input Detection Feedback */}
      {parsedInput && query.trim().length >= 3 && !showSuggestions && (
        <div className="mt-3 flex items-center gap-2 text-sm text-slate-400">
          <span>Detected:</span>
          <span className={cn("font-medium", typeConfig?.color)}>
            {typeConfig?.label}
          </span>
          {parsedInput.type === "url" && parsedInput.metadata.domain && (
            <span className="text-slate-500">
              → Domain: {parsedInput.metadata.domain}
            </span>
          )}
          {parsedInput.type === "phone" && parsedInput.metadata.phoneFormatted && (
            <span className="text-slate-500">
              → {parsedInput.metadata.phoneFormatted}
            </span>
          )}
        </div>
      )}

      {/* Quick Examples */}
      {!query && (
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="text-sm text-slate-500">Try:</span>
          {[
            "best running shoes",
            "example.com",
            "Acme Corporation",
            "(555) 123-4567",
          ].map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => setQuery(example)}
              className="rounded-full bg-slate-800 px-3 py-1 text-sm text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
            >
              {example}
            </button>
          ))}
        </div>
      )}
    </form>
  );
}
