"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Package,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Pencil,
  Shield,
  Loader2,
  ExternalLink,
  ShoppingBag,
  Box,
  Award,
  Hash,
  Calendar,
  Tag,
  CheckCircle2,
  ImageIcon,
  Download,
} from "lucide-react";
import type { Product } from "@/types/product";
import { PSASlabTemplate } from "@/components/admin/psa-slab-template";
import { createProduct } from "@/actions/inventory";

// ─── Types ───

type MainTab = "psa-lookup" | "sealed";


interface PSACertData {
  certNumber: string;
  year: string;
  brand: string;
  category: string;
  cardName: string;
  variety: string;
  grade: string;
  gradeName: string;
  labelType: string;
  subject: string;
  cardNumber: string;
  totalPopulation: number;
  totalPopulationWithHigher: number;
}

interface PokemonCard {
  id: string;
  name: string;
  number: string;
  rarity: string;
  supertype: string;
  subtypes: string[];
  imageSmall: string;
  imageLarge: string;
  setId: string;
  setName: string;
  setSeries: string;
  setSymbol: string;
  marketPrice: number | null;
  tcgplayerUrl: string | null;
}

// ─── Helpers ───

function isGraded(p: Product): boolean {
  return (
    p.tags?.includes("graded") === true ||
    /\[(PSA|BGS|CGC|SGC|ACE|TAG)\s/i.test(p.name)
  );
}

function isSealed(p: Product): boolean {
  return p.tags?.includes("sealed") === true;
}

function getGradeBadge(p: Product): string | null {
  const m = p.name.match(/\[([A-Z]{2,3}\s+\d+(?:\.\d+)?(?:\s+.*?)?)\]/);
  return m ? m[1] : null;
}

// ════════════════════════════════════════════════════════════
// PSA LOOKUP TAB
// ════════════════════════════════════════════════════════════

function PSALookupTab() {
  const [certInput, setCertInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [certData, setCertData] = useState<PSACertData | null>(null);
  const [cardImage, setCardImage] = useState<string>("");
  const [cardImageLarge, setCardImageLarge] = useState<string>("");
  const [matchedCards, setMatchedCards] = useState<PokemonCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<PokemonCard | null>(null);
  const [price, setPrice] = useState("");
  const [adding, setAdding] = useState(false);
  const [slabDataUrl, setSlabDataUrl] = useState<string>("");
  const [error, setError] = useState("");

  const lookupCert = async () => {
    const cert = certInput.trim();
    if (!cert || !/^\d+$/.test(cert)) {
      toast.error("Enter a valid numeric cert number");
      return;
    }

    setLoading(true);
    setError("");
    setCertData(null);
    setMatchedCards([]);
    setSelectedCard(null);
    setCardImage("");
    setCardImageLarge("");
    setSlabDataUrl("");

    try {
      // 1. Fetch PSA cert data
      const psaRes = await fetch(`/api/psa/${cert}`);
      if (!psaRes.ok) {
        const err = await psaRes.json();
        throw new Error(err.error || "PSA lookup failed");
      }
      const psaData = await psaRes.json();
      const cd = psaData.cert as PSACertData;
      setCertData(cd);

      // 2. Search Pokemon TCG API for card image
      // PSA card names sometimes have rarity prefixes like "FA/", "SR/" — strip them
      // But keep names like "PIKACHU/GREY FELT HAT" where "/" is part of the card name
      // Only strip if the part before "/" is a known 1-3 letter rarity code
      const rawName = cd.cardName || cd.subject || "";
      const knownPrefixes = new Set(["FA","SR","RR","AA","HR","AR","SAR","CSR","CHR","SIR","TG","GG","SV","IR","UR","PR"]);
      let searchName = rawName;
      const slashIdx = rawName.indexOf("/");
      if (slashIdx > 0 && slashIdx <= 3) {
        const prefix = rawName.slice(0, slashIdx).toUpperCase();
        if (knownPrefixes.has(prefix)) {
          searchName = rawName.slice(slashIdx + 1);
        }
      }
      // For names with "/" that aren't prefixes (e.g. "PIKACHU/GREY FELT HAT"), search the full name
      // Also try just the first part as the Pokemon name
      const searchTerms = searchName.includes("/")
        ? searchName.split("/")[0].trim()
        : searchName;
      searchName = searchTerms.replace(/\s+/g, " ").trim();
      if (searchName) {
        try {
          // Pass PSA variety/set info so search can rank the best match
          const params = new URLSearchParams({ q: searchName });
          if (cd.variety) params.set("set", cd.variety);

          const tcgRes = await fetch(
            `/api/pokemon/search?${params.toString()}`
          );
          if (tcgRes.ok) {
            const tcgData = await tcgRes.json();
            const cards = (tcgData.cards as PokemonCard[]).filter(
              (c) => c.imageSmall || c.imageLarge
            );
            setMatchedCards(cards);

            if (cards.length > 0) {
              setSelectedCard(cards[0]);
              setCardImage(cards[0].imageSmall);
              setCardImageLarge(cards[0].imageLarge);
            }
          }
        } catch {
          // Card image search is best-effort
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Lookup failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const selectCard = (card: PokemonCard) => {
    setSelectedCard(card);
    setCardImage(card.imageSmall);
    setCardImageLarge(card.imageLarge);
    setSlabDataUrl("");
  };

  const addToInventory = async () => {
    if (!certData || !price) {
      toast.error("Enter a price first");
      return;
    }

    setAdding(true);
    try {
      const productName = `${certData.cardName || certData.subject} — PSA ${certData.grade}`;
      const images: string[] = [];
      if (slabDataUrl) images.push(slabDataUrl);
      if (cardImageLarge) images.push(cardImageLarge);
      else if (cardImage) images.push(cardImage);

      const tags = [
        "pokemon",
        "psa",
        "graded",
        `psa-${certData.grade}`,
      ];
      if (selectedCard?.setName) tags.push(selectedCard.setName.toLowerCase());

      const description = [
        certData.cardName || certData.subject,
        certData.year ? `Year: ${certData.year}` : "",
        certData.category ? `Category: ${certData.category}` : "",
        certData.variety ? `Variety: ${certData.variety}` : "",
        `PSA Grade: ${certData.gradeName || certData.grade}`,
        `Cert #${certData.certNumber}`,
        `Verify at psacard.com/cert/${certData.certNumber}`,
        certData.totalPopulation
          ? `Population: ${certData.totalPopulation}`
          : "",
      ]
        .filter(Boolean)
        .join("\n");

      const result = await createProduct({
        name: productName,
        description,
        brand: "Pokemon TCG",
        condition: "new",
        price: parseFloat(price),
        quantity: 1,
        images,
        tags,
        is_active: true,
        is_featured: false,
        has_box: true,
        low_stock_threshold: 1,
        is_drop: false,
        drop_sold_count: 0,
      });

      if (result.error) throw new Error(result.error);

      toast.success(`Added: ${productName}`);
      setCertInput("");
      setCertData(null);
      setMatchedCards([]);
      setSelectedCard(null);
      setCardImage("");
      setCardImageLarge("");
      setPrice("");
      setSlabDataUrl("");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to add product"
      );
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Lookup Input */}
      <div className="rounded-xl border bg-card p-6">
        <div className="flex flex-col gap-2 mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            PSA Cert Lookup
          </h2>
          <p className="text-sm text-muted-foreground">
            Enter a PSA certification number to look up card details and
            generate a slab image.
          </p>
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1 max-w-md">
            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Enter PSA cert number (e.g. 65000001)"
              value={certInput}
              onChange={(e) => setCertInput(e.target.value.replace(/\D/g, ""))}
              onKeyDown={(e) => e.key === "Enter" && lookupCert()}
              className="pl-9 text-lg h-12"
            />
          </div>
          <Button
            onClick={lookupCert}
            disabled={loading || !certInput.trim()}
            className="h-12 px-8"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Search className="h-4 w-4 mr-2" />
            )}
            Lookup
          </Button>
        </div>

        {error && (
          <p className="mt-3 text-sm text-destructive">{error}</p>
        )}
      </div>

      {/* Results */}
      <AnimatePresence mode="wait">
        {certData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
            {/* Left: Card Info + Slab Preview */}
            <div className="space-y-6">
              {/* PSA Data Card */}
              <div className="rounded-xl border bg-card p-6 space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Award className="h-5 w-5 text-amber-500" />
                  PSA Certificate Details
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Card Name</span>
                    <p className="font-medium">
                      {certData.cardName || certData.subject}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Grade</span>
                    <p className="font-bold text-xl">
                      <Badge
                        className={
                          parseInt(certData.grade) === 10
                            ? "bg-red-700 text-white text-base px-3 py-1"
                            : "bg-blue-700 text-white text-base px-3 py-1"
                        }
                      >
                        PSA {certData.grade}
                      </Badge>
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Year</span>
                    <p className="font-medium flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {certData.year || "N/A"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Category</span>
                    <p className="font-medium">{certData.category || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Cert #</span>
                    <p className="font-mono font-medium">
                      {certData.certNumber}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Population</span>
                    <p className="font-medium">
                      {certData.totalPopulation || "N/A"}
                    </p>
                  </div>
                  {certData.variety && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Variety</span>
                      <p className="font-medium">{certData.variety}</p>
                    </div>
                  )}
                </div>

                <a
                  href={`https://www.psacard.com/cert/${certData.certNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  Verify on PSA <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>

              {/* Price + Add to Inventory */}
              <div className="rounded-xl border bg-card p-6 space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-primary" />
                  Add to Inventory
                </h3>
                <div className="flex gap-3 items-end">
                  <div className="flex-1 max-w-[200px]">
                    <Label htmlFor="price" className="text-sm mb-1.5 block">
                      Selling Price
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        $
                      </span>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="pl-7"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={addToInventory}
                    disabled={adding || !price}
                    className="gap-2"
                  >
                    {adding ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    Add to Inventory
                  </Button>
                </div>
              </div>
            </div>

            {/* Right: Slab Preview + Card Image Match */}
            <div className="space-y-6">
              {/* Slab Template */}
              {cardImageLarge && (
                <div className="rounded-xl border bg-card p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <ImageIcon className="h-5 w-5 text-primary" />
                    Slab Preview
                  </h3>
                  <PSASlabTemplate
                    cardName={certData.cardName || certData.subject}
                    year={certData.year}
                    grade={certData.grade}
                    certNumber={certData.certNumber}
                    cardImageUrl={cardImageLarge}
                    category={certData.category}
                    variety={certData.variety}
                    onImageGenerated={setSlabDataUrl}
                  />
                </div>
              )}

              {/* Card Image Matches */}
              {matchedCards.length > 0 && (
                <div className="rounded-xl border bg-card p-6">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Search className="h-4 w-4 text-primary" />
                    Card Image Match
                    <Badge variant="secondary" className="ml-auto">
                      {matchedCards.length} found
                    </Badge>
                  </h3>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-[400px] overflow-y-auto">
                    {matchedCards.slice(0, 12).map((card) => (
                      <button
                        key={card.id}
                        onClick={() => selectCard(card)}
                        className={`relative rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                          selectedCard?.id === card.id
                            ? "border-primary ring-2 ring-primary/30"
                            : "border-transparent hover:border-muted-foreground/30"
                        }`}
                      >
                        {card.imageSmall && (
                          <Image
                            src={card.imageSmall}
                            alt={card.name}
                            width={120}
                            height={167}
                            className="w-full h-auto"
                          />
                        )}
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-1.5">
                          <p className="text-[10px] text-white font-medium truncate">
                            {card.setName}
                          </p>
                        </div>
                        {selectedCard?.id === card.id && (
                          <div className="absolute top-1 right-1">
                            <CheckCircle2 className="h-5 w-5 text-primary fill-primary/20" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* No card images found */}
              {certData && matchedCards.length === 0 && !loading && (
                <div className="rounded-xl border bg-card p-6 text-center text-muted-foreground">
                  <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">
                    No card images found. The slab will be generated with a
                    placeholder.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// SEALED PRODUCTS TAB
// ════════════════════════════════════════════════════════════

interface SealedFormState {
  name: string;
  price: string;
  quantity: string;
  image: string;
}

function SealedProductsTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<PokemonCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<PokemonCard | null>(null);
  const [form, setForm] = useState<SealedFormState>({
    name: "",
    price: "",
    quantity: "1",
    image: "",
  });
  const [adding, setAdding] = useState(false);

  const SEALED_TYPES = [
    "Booster Box",
    "Elite Trainer Box",
    "Booster Bundle",
    "Blister Pack",
    "Collection Box",
    "Tin",
    "Premium Collection",
    "Build & Battle",
  ];

  const searchSets = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(
        `/api/pokemon/search?q=${encodeURIComponent(searchQuery.trim())}`
      );
      if (res.ok) {
        const data = await res.json();
        setResults(data.cards ?? []);
      }
    } catch {
      toast.error("Search failed");
    }
    setSearching(false);
  };

  const selectProduct = (card: PokemonCard) => {
    setSelectedCard(card);
    setForm((f) => ({
      ...f,
      name: card.name,
      image: card.imageLarge || card.imageSmall,
    }));
  };

  const publishProduct = async (sealedType: string) => {
    if (!form.name || !form.price) {
      toast.error("Enter a name and price");
      return;
    }

    setAdding(true);
    try {
      const productName = `${form.name} ${sealedType}`;
      const images: string[] = [];
      if (form.image) images.push(form.image);

      const tags = [
        "pokemon",
        "sealed",
        sealedType.toLowerCase().replace(/\s+/g, "-"),
      ];
      if (selectedCard?.setName)
        tags.push(selectedCard.setName.toLowerCase());

      const result = await createProduct({
        name: productName,
        description: `${productName}\nSealed Pokemon TCG product.`,
        brand: "Pokemon TCG",
        condition: "new",
        price: parseFloat(form.price),
        quantity: parseInt(form.quantity) || 1,
        images,
        tags,
        is_active: true,
        is_featured: false,
        has_box: true,
        low_stock_threshold: 1,
        is_drop: false,
        drop_sold_count: 0,
      });

      if (result.error) throw new Error(result.error);

      toast.success(`Published: ${productName}`);
      setForm({ name: "", price: "", quantity: "1", image: "" });
      setSelectedCard(null);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to add product"
      );
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="rounded-xl border bg-card p-6">
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <Box className="h-5 w-5 text-primary" />
          Sealed Products
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Search for Pokemon TCG sets to add sealed products (booster boxes,
          ETBs, etc.)
        </p>

        <div className="flex gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search Pokemon sets or cards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && searchSets()}
              className="pl-9"
            />
          </div>
          <Button
            onClick={searchSets}
            disabled={searching || !searchQuery.trim()}
          >
            {searching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Search"
            )}
          </Button>
        </div>
      </div>

      {/* Results Grid */}
      {results.length > 0 && (
        <div className="rounded-xl border bg-card p-6">
          <h3 className="font-semibold mb-3">
            Search Results ({results.length})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 max-h-[500px] overflow-y-auto">
            {results.map((card) => (
              <button
                key={card.id}
                onClick={() => selectProduct(card)}
                className={`relative rounded-lg overflow-hidden border-2 transition-all hover:scale-[1.03] ${
                  selectedCard?.id === card.id
                    ? "border-primary ring-2 ring-primary/30"
                    : "border-transparent hover:border-muted-foreground/30"
                }`}
              >
                {card.imageSmall && (
                  <Image
                    src={card.imageSmall}
                    alt={card.name}
                    width={150}
                    height={209}
                    className="w-full h-auto"
                  />
                )}
                <div className="p-2 text-left">
                  <p className="text-xs font-medium truncate">{card.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {card.setName}
                  </p>
                  {card.marketPrice && (
                    <p className="text-xs font-bold text-primary">
                      Market: {formatCurrency(card.marketPrice)}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Product Form */}
      {selectedCard && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border bg-card p-6 space-y-4"
        >
          <h3 className="font-semibold flex items-center gap-2">
            <Tag className="h-4 w-4 text-primary" />
            Create Sealed Product
          </h3>

          <div className="flex gap-6">
            {/* Preview */}
            <div className="shrink-0">
              {selectedCard.imageLarge && (
                <Image
                  src={selectedCard.imageLarge}
                  alt={selectedCard.name}
                  width={120}
                  height={167}
                  className="rounded-lg"
                />
              )}
            </div>

            {/* Form Fields */}
            <div className="flex-1 space-y-3">
              <div>
                <Label className="text-sm mb-1 block">Product Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="Product name"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm mb-1 block">Price ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.price}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, price: e.target.value }))
                    }
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label className="text-sm mb-1 block">Quantity</Label>
                  <Input
                    type="number"
                    min="1"
                    value={form.quantity}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, quantity: e.target.value }))
                    }
                  />
                </div>
              </div>

              {/* Sealed Type Buttons */}
              <div>
                <Label className="text-sm mb-2 block">
                  Publish as sealed type:
                </Label>
                <div className="flex flex-wrap gap-2">
                  {SEALED_TYPES.map((type) => (
                    <Button
                      key={type}
                      variant="outline"
                      size="sm"
                      disabled={adding || !form.price}
                      onClick={() => publishProduct(type)}
                      className="text-xs"
                    >
                      {adding ? (
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      ) : (
                        <ShoppingBag className="h-3 w-3 mr-1" />
                      )}
                      {type}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// HELPER FUNCTIONS (used by other components)

// ════════════════════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════════════════════

export default function AdminPokemonPage() {
  const [activeTab, setActiveTab] = useState<MainTab>("psa-lookup");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Pokemon Manager
        </h1>
        <p className="text-sm text-muted-foreground">
          PSA cert lookup and sealed products — items go to main inventory
        </p>
      </div>

      {/* Main Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as MainTab)}
      >
        <TabsList className="grid w-full max-w-sm grid-cols-2">
          <TabsTrigger value="psa-lookup" className="gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">PSA Lookup</span>
            <span className="sm:hidden">PSA</span>
          </TabsTrigger>
          <TabsTrigger value="sealed" className="gap-2">
            <Box className="h-4 w-4" />
            <span className="hidden sm:inline">Sealed Products</span>
            <span className="sm:hidden">Sealed</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="psa-lookup" className="mt-6">
          <PSALookupTab />
        </TabsContent>

        <TabsContent value="sealed" className="mt-6">
          <SealedProductsTab />
        </TabsContent>


      </Tabs>
    </div>
  );
}
