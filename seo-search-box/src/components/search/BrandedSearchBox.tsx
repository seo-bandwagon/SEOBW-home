"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MapPin, Building2 } from "lucide-react";
import { parseInput } from "@/lib/parsers/inputParser";
import { useAutocomplete } from "@/lib/hooks/useAutocomplete";

const PLACEHOLDER_EXAMPLES = [
  { text: "Enter a URL", example: "mysite.com" },
  { text: "Enter a keyword", example: '"plumber near me"' },
  { text: "Enter a business name", example: "Joe's Pizza" },
  { text: "Enter an address", example: "123 Main St" },
  { text: "Enter a phone number", example: "555-123-4567" },
];

export function BrandedSearchBox() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const { predictions, isLoading: isLoadingSuggestions, resetSession } = useAutocomplete(query, {
    minLength: 3,
    debounceMs: 250,
  });

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
        const params = new URLSearchParams({
          q: parsed.normalized || query,
          type: parsed.type,
        });

        router.push(`/results?${params.toString()}`);
      } catch (error) {
        console.error("Search error:", error);
        setIsLoading(false);
      }
    },
    [query, isLoading, router]
  );

  const handleSelectSuggestion = useCallback(
    (suggestion: typeof predictions[0]) => {
      setQuery(suggestion.mainText);
      setShowSuggestions(false);
      resetSession(); // Reset session token after selection
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

  const showPlaceholder = !query && !isFocused;

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-[750px] mx-auto relative">
      <div className="relative rounded-full p-[3px] bg-pink animate-pulse-glow">
        <div className="flex bg-navy rounded-full overflow-hidden">
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => {
                // Delay to allow click on suggestions
                setTimeout(() => setIsFocused(false), 200);
              }}
              onKeyDown={handleKeyDown}
              placeholder=" "
              aria-label="Enter a URL, keyword, business name, address, or phone number"
              autoComplete="off"
              disabled={isLoading}
              className="w-full font-mono text-base py-[22px] px-[35px] bg-transparent border-none text-[#F5F5F5] outline-none"
            />

            {showPlaceholder && (
              <div
                className="typewriter-container absolute top-0 left-[35px] right-[120px] h-full flex items-center pointer-events-none font-mono text-base"
                aria-hidden="true"
              >
                {PLACEHOLDER_EXAMPLES.map((item, index) => (
                  <span key={index} className="typewriter-text text-[#F5F5F5]/60">
                    {item.text}{" "}
                    <span className="text-[#F5F5F5]/40">(e.g., </span>
                    <span className="text-pink font-medium">{item.example}</span>
                    <span className="text-[#F5F5F5]/40">)</span>
                    <span className="text-pink font-bold animate-blink">_</span>
                  </span>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={!query.trim() || isLoading}
            className="font-heading text-xl bg-pink text-[#F5F5F5] py-[22px] px-[45px] border-none tracking-[2px] cursor-pointer transition-all whitespace-nowrap hover:bg-pink-hover disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                SCANNING...
              </span>
            ) : (
              "SCAN NOW"
            )}
          </button>
        </div>
      </div>

      {/* Autocomplete Suggestions */}
      {showSuggestions && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-2 bg-[#000022] border-2 border-pink rounded-xl shadow-2xl overflow-hidden z-50"
        >
          {isLoadingSuggestions && predictions.length === 0 ? (
            <div className="px-4 py-3 text-[#F5F5F5]/50 text-sm flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading suggestions...
            </div>
          ) : (
            <ul className="py-2">
              {predictions.map((prediction, index) => {
                const isAddress = prediction.types.includes("geocode") || 
                                  prediction.types.includes("street_address");
                const Icon = isAddress ? MapPin : Building2;

                return (
                  <li key={prediction.placeId}>
                    <button
                      type="button"
                      onClick={() => handleSelectSuggestion(prediction)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`w-full px-4 py-3 flex items-start gap-3 text-left transition-colors ${
                        index === selectedIndex
                          ? "bg-pink/20"
                          : "hover:bg-[#F5F5F5]/5"
                      }`}
                    >
                      <Icon
                        className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                          isAddress ? "text-pink" : "text-orange-400"
                        }`}
                      />
                      <div className="min-w-0">
                        <div className="text-[#F5F5F5] font-medium truncate">
                          {prediction.mainText}
                        </div>
                        {prediction.secondaryText && (
                          <div className="text-[#F5F5F5]/50 text-sm truncate">
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
    </form>
  );
}
