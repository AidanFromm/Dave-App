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
  GRADING_SCALES,
  RAW_CONDITIONS,
  BGS_SUBGRADE_FIELDS,
  BGS_SUBGRADE_VALUES,
  getGradeLabel,
  getGradesForCompany,
} from "@/lib/gradingScales";
import type {
  PokemonCardSearchResult,
  PokemonCardDetail,
  ScanFormData,
  PokemonGradingData,
} from "@/types/barcode";

interface PokemonScanFormProps {
  card: PokemonCardSearchResult;
  onSubmit: (data: ScanFormData) => Promise<void>;
  onBack: () => void;
}

const GRADING_COMPANIES = Object.entries(GRADING_SCALES).map(([key, scale]) => ({
  key,
  name: scale.name,
  fullName: scale.fullName,
}));

export function PokemonScanForm({ card, onSubmit, onBack }: PokemonScanFormProps) {
  const [detail, setDetail] = useState<PokemonCardDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(true);
  const [cost, setCost] = useState("");
  const [price, setPrice] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Grading state
  const [conditionType, setConditionType] = useState<"raw" | "graded">("raw");
  const [rawCondition, setRawCondition] = useState("NM");
  const [gradingCompany, setGradingCompany] = useState("psa");
  const [grade, setGrade] = useState<number>(10);
  const [isBlackLabel, setIsBlackLabel] = useState(false);
  const [subgrades, setSubgrades] = useState<Record<string, number>>({
    centering: 9.5,
    corners: 9.5,
    edges: 9.5,
    surface: 9.5,
  });

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

  const getBestPrice = (): number | null => {
    if (!detail?.variantPrices) return card.marketPrice;
    for (const variant of [
      "holofoil", "reverseHolofoil", "normal",
      "1stEditionHolofoil", "1stEditionNormal",
    ]) {
      const p = detail.variantPrices[variant];
      if (p?.market != null) return p.market;
    }
    return card.marketPrice;
  };

  const bestPrice = getBestPrice();

  const currentScale = GRADING_SCALES[gradingCompany];
  const availableGrades = currentScale ? getGradesForCompany(gradingCompany) : [];

  // Build grade label for display
  const getGradeBadge = (): string => {
    if (conditionType === "raw") {
      const cond = RAW_CONDITIONS.find((c) => c.value === rawCondition);
      return cond ? `Raw - ${cond.abbrev}` : "Raw";
    }
    const company = GRADING_SCALES[gradingCompany];
    if (!company) return "";
    const label = getGradeLabel(gradingCompany, grade, isBlackLabel);
    if (isBlackLabel && gradingCompany === "bgs") {
      return `BGS 10 Black Label`;
    }
    return `${company.name} ${grade} - ${label}`;
  };

  // Map condition to DB value
  const getConditionDbValue = () => {
    if (conditionType === "graded") return "new" as const;
    switch (rawCondition) {
      case "NM": return "new" as const;
      case "LP": return "used_like_new" as const;
      case "MP": return "used_good" as const;
      case "HP":
      case "DMG": return "used_fair" as const;
      default: return "new" as const;
    }
  };

  const handleSubmit = async () => {
    const priceNum = parseFloat(price);
    const costNum = parseFloat(cost);

    if (isNaN(priceNum) || priceNum <= 0) {
      toast.error("Valid selling price is required");
      return;
    }

    const gradingData: PokemonGradingData = {
      conditionType,
      ...(conditionType === "raw"
        ? { rawCondition }
        : {
            gradingCompany,
            grade,
            isBlackLabel: gradingCompany === "bgs" && grade === 10 && isBlackLabel,
            ...(gradingCompany === "bgs"
              ? { subgrades: { ...subgrades } as { centering: number; corners: number; edges: number; surface: number } }
              : {}),
          }),
    };

    const gradeBadge = getGradeBadge();
    const productName = conditionType === "graded"
      ? `${card.name} - ${card.setName} #${card.number} [${gradeBadge}]`
      : `${card.name} - ${card.setName} #${card.number}`;

    setSubmitting(true);
    try {
      await onSubmit({
        barcode: card.id,
        productName,
        brand: "Pokemon TCG",
        colorway: card.rarity,
        styleId: `${card.setId}-${card.number}`,
        size: null,
        stockxProductId: null,
        stockxVariantId: null,
        condition: getConditionDbValue(),
        hasBox: false,
        cost: isNaN(costNum) ? 0 : costNum,
        price: priceNum,
        images: images.length > 0 ? images : [card.imageLarge || card.imageSmall],
        productType: "pokemon",
        grading: gradingData,
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

        <div className="mx-auto max-w-xs">
          <img
            src={card.imageLarge || card.imageSmall}
            alt={card.name}
            className="w-full rounded-xl shadow-lg"
          />
        </div>

        <div className="space-y-2 text-center">
          <h2 className="text-xl font-bold">{card.name}</h2>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {card.setSymbol && (
              <img src={card.setSymbol} alt="" className="h-4 w-4" />
            )}
            <span className="text-sm text-muted-foreground">
              {card.setName} - #{card.number}
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
        {/* Condition Type Toggle */}
        <div className="space-y-2">
          <Label>Condition Type</Label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setConditionType("raw")}
              className={cn(
                "rounded-lg border-2 px-4 py-3 text-center transition-colors",
                conditionType === "raw"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:border-muted-foreground"
              )}
            >
              <p className="text-sm font-semibold">Raw</p>
              <p className="text-xs text-muted-foreground">Ungraded card</p>
            </button>
            <button
              type="button"
              onClick={() => setConditionType("graded")}
              className={cn(
                "rounded-lg border-2 px-4 py-3 text-center transition-colors",
                conditionType === "graded"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:border-muted-foreground"
              )}
            >
              <p className="text-sm font-semibold">Graded</p>
              <p className="text-xs text-muted-foreground">Professional slab</p>
            </button>
          </div>
        </div>

        {/* Raw Condition Selector */}
        {conditionType === "raw" && (
          <div className="space-y-2">
            <Label>Condition</Label>
            <div className="grid grid-cols-2 gap-2">
              {RAW_CONDITIONS.map((cond) => (
                <button
                  key={cond.value}
                  type="button"
                  onClick={() => setRawCondition(cond.value)}
                  className={cn(
                    "rounded-lg border-2 px-3 py-3 text-left transition-colors",
                    rawCondition === cond.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-muted-foreground"
                  )}
                >
                  <p className="text-sm font-semibold">
                    {cond.label} ({cond.abbrev})
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {cond.description}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Graded Card Selector */}
        {conditionType === "graded" && (
          <div className="space-y-4">
            {/* Grading Company */}
            <div className="space-y-2">
              <Label>Grading Company</Label>
              <div className="grid grid-cols-3 gap-2">
                {GRADING_COMPANIES.map((company) => (
                  <button
                    key={company.key}
                    type="button"
                    onClick={() => {
                      setGradingCompany(company.key);
                      setIsBlackLabel(false);
                      // Reset grade to highest for this company
                      const grades = getGradesForCompany(company.key);
                      if (grades.length > 0) setGrade(grades[0].value);
                    }}
                    className={cn(
                      "rounded-lg border-2 px-3 py-2.5 text-center transition-colors",
                      gradingCompany === company.key
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-muted-foreground"
                    )}
                  >
                    <p className="text-sm font-bold">{company.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {company.fullName}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Grade Selection */}
            <div className="space-y-2">
              <Label>Grade</Label>
              <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-5">
                {availableGrades.map((g) => {
                  const isSelected =
                    grade === g.value && (g.isBlackLabel ? isBlackLabel : !isBlackLabel);
                  return (
                    <button
                      key={`${g.value}-${g.isBlackLabel}`}
                      type="button"
                      onClick={() => {
                        setGrade(g.value);
                        setIsBlackLabel(!!g.isBlackLabel);
                      }}
                      className={cn(
                        "rounded-lg border-2 px-2 py-2 text-center transition-colors",
                        isSelected
                          ? g.isBlackLabel
                            ? "border-yellow-500 bg-yellow-500/10 text-yellow-600"
                            : "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-muted-foreground"
                      )}
                    >
                      <p className="text-sm font-bold">
                        {g.isBlackLabel ? "10 BL" : g.value}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {g.isBlackLabel ? "Black Label" : g.label}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* BGS Subgrades */}
            {gradingCompany === "bgs" && (
              <div className="space-y-3 rounded-lg border border-border p-4">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                  BGS Subgrades (optional)
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  {BGS_SUBGRADE_FIELDS.map((field) => (
                    <div key={field.key} className="space-y-1">
                      <label className="text-xs font-medium">{field.label}</label>
                      <select
                        value={subgrades[field.key] ?? ""}
                        onChange={(e) =>
                          setSubgrades((prev) => ({
                            ...prev,
                            [field.key]: parseFloat(e.target.value),
                          }))
                        }
                        className="h-9 w-full rounded-md border border-border bg-card px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        {BGS_SUBGRADE_VALUES.map((v) => (
                          <option key={v} value={v}>
                            {v}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Grade Preview Badge */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Preview:</span>
              <Badge
                className={cn(
                  "text-sm px-3 py-1",
                  isBlackLabel
                    ? "bg-black text-yellow-400 border border-yellow-500"
                    : "bg-primary text-primary-foreground"
                )}
              >
                {getGradeBadge()}
              </Badge>
            </div>
          </div>
        )}

        {/* Photos */}
        <div className="space-y-2">
          <Label>Photos (optional -- card stock image used if none uploaded)</Label>
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
