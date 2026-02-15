import { useState, useEffect, useRef, useCallback } from "react";

export interface AutocompletePrediction {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
  types: string[];
}

interface UseAutocompleteOptions {
  minLength?: number;
  debounceMs?: number;
  types?: "establishment" | "address" | "geocode" | "(regions)" | "(cities)";
}

export function useAutocomplete(
  input: string,
  options: UseAutocompleteOptions = {}
) {
  const { minLength = 3, debounceMs = 300, types = "establishment" } = options;

  const [predictions, setPredictions] = useState<AutocompletePrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Session token for billing optimization
  const sessionTokenRef = useRef<string>(generateSessionToken());
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Reset session token when user selects a prediction
  const resetSession = useCallback(() => {
    sessionTokenRef.current = generateSessionToken();
  }, []);

  useEffect(() => {
    // Clear previous debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Clear predictions if input is too short
    if (!input || input.length < minLength) {
      setPredictions([]);
      setIsLoading(false);
      return;
    }

    // Check if input looks like phone/URL (skip autocomplete)
    if (shouldSkipAutocomplete(input)) {
      setPredictions([]);
      setIsLoading(false);
      return;
    }

    // Determine types based on input
    const effectiveTypes = detectInputTypes(input, types);

    setIsLoading(true);

    // Debounce the API call
    debounceTimerRef.current = setTimeout(async () => {
      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      try {
        const params = new URLSearchParams({
          input,
          types: effectiveTypes,
          session: sessionTokenRef.current,
        });

        const response = await fetch(`/api/autocomplete?${params}`, {
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error("Autocomplete request failed");
        }

        const data = await response.json();
        setPredictions(data.predictions || []);
        setError(null);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          // Ignore abort errors
          return;
        }
        console.error("Autocomplete error:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
        setPredictions([]);
      } finally {
        setIsLoading(false);
      }
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [input, minLength, debounceMs, types]);

  return {
    predictions,
    isLoading,
    error,
    resetSession,
  };
}

/**
 * Generate a random session token for Places API billing optimization
 */
function generateSessionToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Check if input looks like a phone number or URL (skip autocomplete)
 */
function shouldSkipAutocomplete(input: string): boolean {
  // Phone pattern: mostly digits
  const digits = input.replace(/\D/g, "");
  if (digits.length >= 7 && digits.length / input.replace(/\s/g, "").length > 0.7) {
    return true;
  }

  // URL pattern
  if (/^(https?:\/\/)?[\w-]+\.[a-z]{2,}/i.test(input)) {
    return true;
  }

  // Domain pattern
  if (/^[\w-]+\.(com|org|net|io|co|dev)$/i.test(input)) {
    return true;
  }

  return false;
}

/**
 * Detect what type of autocomplete to use based on input
 */
function detectInputTypes(
  input: string,
  defaultTypes: string
): string {
  // If input starts with a number and has street-like words, use address
  if (/^\d+\s/.test(input) || /\b(st|street|ave|road|dr|blvd)\b/i.test(input)) {
    return "address";
  }

  // If input has comma (likely address), use geocode
  if (input.includes(",")) {
    return "geocode";
  }

  // Default to establishment (businesses)
  return defaultTypes;
}
