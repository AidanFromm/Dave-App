"use client";

import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2 } from "lucide-react";
import type { PokemonCardSearchResult } from "@/types/barcode";

interface PokemonCardSearchProps {
  onSelect: (card: PokemonCardSearchResult) => void;
}

export function PokemonCardSearch({ onSelect }: PokemonCardSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PokemonCardSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  const handleSearch = useCallback(async () => {
    const trimmed = query.trim();
    if (!trimmed) return;

    setLoading(true);
    setError("");
    setSearched(true);

    try {
      const res = await fetch(
        `/api/pokemon/search?q=${encodeURIComponent(trimmed)}`
      );
      const data = await res.json();

      if (data.error) {
        setError(data.error);
        setResults([]);
      } else {
        setResults(data.cards ?? []);
        if ((data.cards ?? []).length === 0) {
          setError("No cards found. Try a different name or check spelling.");
        }
      }
    } catch {
      setError("Search timed out or failed. The Pokemon TCG API may be slow — try again.");
    }

    setLoading(false);
  }, [query]);

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name (Charizard) or number (158)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="h-14 pl-10 text-lg"
            autoFocus
          />
        </div>
        <Button
          onClick={handleSearch}
          disabled={loading}
          size="lg"
          className="h-14 px-6"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            "Search"
          )}
        </Button>
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {/* Results grid */}
      {results.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {results.map((card) => (
            <button
              key={card.id}
              type="button"
              onClick={() => onSelect(card)}
              className="group relative overflow-hidden rounded-xl border-2 border-transparent bg-card text-left transition-all hover:border-primary hover:shadow-lg"
            >
              {/* Card image */}
              <div className="aspect-[245/342] w-full overflow-hidden">
                <img
                  src={card.imageSmall}
                  alt={card.name}
                  className="h-full w-full object-contain transition-transform group-hover:scale-105"
                  loading="lazy"
                />
              </div>

              {/* Card info */}
              <div className="space-y-1 p-2">
                <p className="truncate text-sm font-semibold">{card.name}</p>
                {(card.setName || card.number) && (
                  <div className="flex items-center gap-1">
                    {card.setSymbol && (
                      <img
                        src={card.setSymbol}
                        alt={card.setName}
                        className="h-3.5 w-3.5"
                      />
                    )}
                    <span className="truncate text-xs text-muted-foreground">
                      {card.setName ? `${card.setName} #${card.number}` : `#${card.number}`}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  {card.rarity ? (
                    <Badge variant="secondary" className="text-[10px]">
                      {card.rarity}
                    </Badge>
                  ) : <span />}
                  {card.marketPrice != null && (
                    <span className="text-xs font-bold text-green-600">
                      ${card.marketPrice.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && searched && results.length === 0 && !error && (
        <div className="py-8 text-center text-sm text-muted-foreground">
          No results found
        </div>
      )}
    </div>
  );
}
