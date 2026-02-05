"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { ImageUpload } from "./image-upload";
import { toast } from "sonner";
import {
  POKEMON_CONDITION_MAP,
  type PokemonCardSearchResult,
  type PokemonCardDetail,
  type ScanFormData,
} from "@/types/barcode";

interface PokemonScanFormProps {
  card: PokemonCardSearchResult;
  onSubmit: (data: ScanFormData) => Promise<void>;
  onBack: () => void;
}

const CONDITIONS = Object.entries(POKEMON_CONDITION_MAP);

export function PokemonScanForm({ card, onSubmit, onBack }: PokemonScanFormProps) {
  const [detail, setDetail] = useState<PokemonCardDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(true);
  const [condition, setCondition] = useState("near_mint");
  const [cost, setCost] = useState("");
  const [price, setPrice] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Fetch full card details on mount
  useEffect(() => {
    async function fetchDetail() {
      try {
        const res = await fetch(`/api/pokemon/card/${card.id}`);
        if (res.ok) {
          const data = await res.json();
          setDetail(data);
        }
      } catch {}
      setLoadingDetail(false);
    }
    fetchDetail();
  }, [card.id]);

  // Determine best market price for suggestion
  const getBestPrice = (): number | null => {
    if (!detail?.variantPrices) return card.marketPrice;
    for (const variant of [
      "holofoil", "reverse-holofoil", "normal",
      "1st-edition-holofoil", "1st-edition-normal",
      "reverseHolofoil", "1stEditionHolofoil",
    ]) {
      const p = detail.variantPrices[variant];
      if (p?.market != null) return p.market;
    }
    return card.marketPrice;
  };

  const bestPrice = getBestPrice();

  const handleSubmit = async () => {
    const priceNum = parseFloat(price);
    const costNum = parseFloat(cost);

    if (isNaN(priceNum) || priceNum <= 0) {
      toast.error("Valid selling price is required");
      return;
    }

    const conditionEntry = POKEMON_CONDITION_MAP[condition];

    setSubmitting(true);
    try {
      await onSubmit({
        barcode: card.id, // Use card ID as barcode identifier
        productName: `${card.name} - ${card.setName} #${card.number}`,
        brand: "Pokemon TCG",
        colorway: card.rarity,
        styleId: `${card.setId}-${card.number}`,
        size: null,
        stockxProductId: null,
        stockxVariantId: null,
        condition: conditionEntry.dbValue,
        hasBox: false,
        cost: isNaN(costNum) ? 0 : costNum,
        price: priceNum,
        images: images.length > 0 ? images : [card.imageLarge || card.imageSmall],
        productType: "pokemon",
      });
    } catch {
      toast.error("Failed to add card");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Left: Card display */}
      <div className="space-y-4">
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Back to search
        </button>

        {/* Card image */}
        <div className="mx-auto max-w-xs">
          <img
            src={card.imageLarge || card.imageSmall}
            alt={card.name}
            className="w-full rounded-xl shadow-lg"
          />
        </div>

        {/* Card meta */}
        <div className="space-y-2 text-center">
          <h2 className="text-xl font-bold">{card.name}</h2>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {card.setSymbol && (
              <img src={card.setSymbol} alt="" className="h-4 w-4" />
            )}
            <span className="text-sm text-muted-foreground">
              {card.setName} · #{card.number}
            </span>
          </div>
          <div className="flex flex-wrap justify-center gap-1.5">
            <Badge variant="secondary">{card.rarity}</Badge>
            {card.subtypes?.map((s) => (
              <Badge key={s} variant="outline" className="text-xs">
                {s}
              </Badge>
            ))}
          </div>
        </div>

        {/* Market prices */}
        {loadingDetail ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : detail?.variantPrices && Object.keys(detail.variantPrices).length > 0 ? (
          <div className="space-y-2">
            <p className="text-sm font-medium">TCGPlayer Market Prices</p>
            <div className="space-y-1.5">
              {Object.entries(detail.variantPrices).map(([variant, prices]) => (
                <div
                  key={variant}
                  className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2"
                >
                  <span className="text-sm capitalize">
                    {variant.replace(/([A-Z])/g, " $1").trim()}
                  </span>
                  <div className="flex gap-3 text-xs">
                    {prices.low != null && (
                      <span className="text-muted-foreground">
                        Low: ${prices.low.toFixed(2)}
                      </span>
                    )}
                    {prices.market != null && (
                      <span className="font-bold text-green-600">
                        Market: ${prices.market.toFixed(2)}
                      </span>
                    )}
                    {prices.high != null && (
                      <span className="text-muted-foreground">
                        High: ${prices.high.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {detail.tcgplayerUrl && (
              <a
                href={detail.tcgplayerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                View on TCGPlayer <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center">
            No pricing data available
          </p>
        )}
      </div>

      {/* Right: Form */}
      <div className="space-y-5">
        {/* Condition */}
        <div className="space-y-2">
          <Label>Condition</Label>
          <div className="grid grid-cols-2 gap-2">
            {CONDITIONS.map(([key, { label }]) => (
              <button
                key={key}
                type="button"
                onClick={() => setCondition(key)}
                className={cn(
                  "rounded-lg border-2 px-3 py-3 text-center transition-colors",
                  condition === key
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-muted-foreground"
                )}
              >
                <p className="text-sm font-semibold">{label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Photos */}
        <div className="space-y-2">
          <Label>Photos (optional — card stock image used if none uploaded)</Label>
          <ImageUpload images={images} onChange={setImages} />
        </div>

        {/* Pricing */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Cost (what you paid)</Label>
            <Input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              className="text-lg"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Selling Price *</Label>
            <Input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="text-lg font-semibold"
            />
          </div>
        </div>

        {/* Suggest price */}
        {bestPrice != null && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPrice(String(bestPrice.toFixed(2)))}
            className="w-full"
          >
            Suggest Price: ${bestPrice.toFixed(2)} (Market)
          </Button>
        )}

        {/* Submit */}
        <Button
          type="button"
          size="lg"
          className="w-full"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          Add to Inventory
        </Button>
      </div>
    </div>
  );
}
