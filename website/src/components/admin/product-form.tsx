"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  productFormSchema,
  type ProductFormValues,
} from "@/lib/validators";
import { createProduct, updateProduct } from "@/actions/inventory";
import type { Product, Category } from "@/types/product";
import { ImageUpload } from "@/components/admin/image-upload";
import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { VariantSizeMatrix, type VariantRow } from "@/components/admin/variant-size-matrix";
import { bulkCreateVariants, deleteVariant as deleteVariantAction, updateVariant as updateVariantAction, createVariant } from "@/actions/variants";
import type { ProductVariant, VariantCondition } from "@/types/product";

interface ProductFormProps {
  product?: Product;
  categories: Category[];
  existingVariants?: ProductVariant[];
}

export function ProductForm({ product, categories, existingVariants = [] }: ProductFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const isEdit = !!product;
  const [variantRows, setVariantRows] = useState<VariantRow[]>(
    existingVariants.map((v) => ({
      id: v.id,
      size: v.size ?? "",
      condition: v.condition,
      price: v.price,
      cost: v.cost ?? 0,
      quantity: v.quantity,
      barcode: v.barcode ?? "",
      isNew: false,
    }))
  );
  const [isSneaker, setIsSneaker] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: product
      ? {
          name: product.name,
          description: product.description ?? "",
          brand: product.brand ?? "",
          sku: product.sku ?? "",
          barcode: product.barcode ?? "",
          size: product.size ?? "",
          colorway: product.colorway ?? "",
          condition: product.condition,
          hasBox: product.has_box,
          price: product.price,
          cost: product.cost ?? undefined,
          compareAtPrice: product.compare_at_price ?? undefined,
          quantity: product.quantity,
          lowStockThreshold: product.low_stock_threshold,
          categoryId: product.category_id ?? "",
          images: product.images ?? [],
          isDrop: product.is_drop,
          isActive: product.is_active,
          isFeatured: product.is_featured,
          tags: product.tags ?? [],
        }
      : {
          condition: "new",
          hasBox: true,
          quantity: 1,
          lowStockThreshold: 5,
          isActive: true,
          isFeatured: false,
          isDrop: false,
          images: [],
          tags: [],
        },
  });

  // Detect sneaker category
  const watchedCategoryId = watch("categoryId");
  useEffect(() => {
    if (watchedCategoryId) {
      const cat = categories.find((c) => c.id === watchedCategoryId);
      const slug = (cat?.slug ?? cat?.name ?? "").toLowerCase();
      setIsSneaker(slug.includes("sneaker") || slug.includes("shoe"));
    } else {
      setIsSneaker(false);
    }
  }, [watchedCategoryId, categories]);

  // Also detect from existing product
  useEffect(() => {
    if (product?.has_variants || existingVariants.length > 0) {
      setIsSneaker(true);
    }
  }, [product, existingVariants]);

  const saveVariants = async (productId: string) => {
    // Delete removed variants
    const currentIds = new Set(variantRows.filter((v) => v.id).map((v) => v.id!));
    const existingIds = existingVariants.map((v) => v.id);
    for (const id of existingIds) {
      if (!currentIds.has(id)) {
        await deleteVariantAction(id);
      }
    }

    // Update existing variants
    for (const row of variantRows.filter((v) => v.id && !v.isNew)) {
      await updateVariantAction(row.id!, {
        size: row.size || null,
        condition: row.condition,
        price: row.price,
        cost: row.cost || null,
        quantity: row.quantity,
        barcode: row.barcode || null,
      });
    }

    // Create new variants
    const newRows = variantRows.filter((v) => v.isNew || !v.id);
    if (newRows.length > 0) {
      await bulkCreateVariants(
        productId,
        newRows.map((r) => ({
          size: r.size,
          condition: r.condition,
          price: r.price,
          cost: r.cost || null,
          quantity: r.quantity,
          barcode: r.barcode || null,
        }))
      );
    }
  };

  const onSubmit = async (data: ProductFormValues) => {
    setLoading(true);

    const payload = {
      name: data.name,
      description: data.description || null,
      brand: data.brand || null,
      sku: data.sku || null,
      barcode: data.barcode || null,
      size: data.size || null,
      colorway: data.colorway || null,
      condition: data.condition,
      has_box: data.hasBox,
      price: data.price,
      cost: data.cost ?? null,
      compare_at_price: data.compareAtPrice ?? null,
      quantity: data.quantity,
      low_stock_threshold: data.lowStockThreshold,
      category_id: data.categoryId || null,
      images: data.images,
      is_drop: data.isDrop,
      is_active: data.isActive,
      is_featured: data.isFeatured,
      tags: data.tags,
    };

    if (isEdit) {
      const result = await updateProduct(product.id, payload);
      if (result.error) {
        toast.error(result.error);
      } else {
        // Handle variants for sneakers
        if (isSneaker && variantRows.length > 0) {
          await saveVariants(product.id);
        }
        toast.success("Product updated");
        router.push("/admin/products");
        router.refresh();
      }
    } else {
      const result = await createProduct(payload);
      if (result.error) {
        toast.error(result.error);
      } else {
        // Handle variants for sneakers
        if (isSneaker && variantRows.length > 0 && result.data?.id) {
          await saveVariants(result.data.id);
        }
        toast.success("Product created");
        router.push("/admin/products");
        router.refresh();
      }
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic info */}
      <div className="space-y-4">
        <div>
          <h2 className="font-semibold">Product Info</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Basic details about the product. Name and price are required.</p>
        </div>
        <div className="space-y-2">
          <Label>Product Name *</Label>
          <Input {...register("name")} placeholder="e.g. Nike Air Jordan 1 Retro High OG" />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea {...register("description")} rows={3} placeholder="Describe the product — condition details, notable features, etc." />
        </div>
        <div className="space-y-2">
          <Label>Images</Label>
          <ImageUpload
            images={watch("images") ?? []}
            onChange={(urls) => setValue("images", urls)}
            maxImages={6}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Brand</Label>
            <Input {...register("brand")} placeholder="e.g. Nike, Adidas, Pokémon" />
          </div>
          <div className="space-y-2">
            <Label>SKU</Label>
            <Input {...register("sku")} placeholder="e.g. DZ5485-612" />
            <p className="text-[10px] text-muted-foreground">Style code or internal ID</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-2">
            <Label>Barcode</Label>
            <Input {...register("barcode")} placeholder="UPC / EAN" />
          </div>
          <div className="space-y-2">
            <Label>Size</Label>
            <Input {...register("size")} placeholder="e.g. 10, 10.5" />
          </div>
          <div className="space-y-2">
            <Label>Colorway</Label>
            <Input {...register("colorway")} placeholder="e.g. Bred, University Blue" />
          </div>
        </div>
      </div>

      {/* Condition & Category */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Condition</Label>
          <Select
            value={watch("condition")}
            onValueChange={(v) =>
              setValue("condition", v as ProductFormValues["condition"])
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="used">Used</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Category</Label>
          <Select
            value={watch("categoryId") ?? ""}
            onValueChange={(v) => setValue("categoryId", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Pricing */}
      <div className="space-y-4">
        <div>
          <h2 className="font-semibold">Pricing</h2>
          <p className="text-xs text-muted-foreground mt-0.5">&quot;Compare At&quot; shows as a strikethrough price to highlight a deal.</p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-2">
            <Label>Price *</Label>
            <Input
              type="number"
              step="0.01"
              {...register("price", { valueAsNumber: true })}
            />
            {errors.price && (
              <p className="text-xs text-destructive">
                {errors.price.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Cost</Label>
            <Input
              type="number"
              step="0.01"
              {...register("cost", { valueAsNumber: true })}
            />
          </div>
          <div className="space-y-2">
            <Label>Compare At</Label>
            <Input
              type="number"
              step="0.01"
              {...register("compareAtPrice", { valueAsNumber: true })}
            />
          </div>
        </div>
      </div>

      {/* Inventory */}
      <div className="space-y-4">
        <div>
          <h2 className="font-semibold">Inventory</h2>
          <p className="text-xs text-muted-foreground mt-0.5">You&apos;ll get an alert when stock drops below the threshold.</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Quantity *</Label>
            <Input
              type="number"
              {...register("quantity", { valueAsNumber: true })}
            />
            {errors.quantity && (
              <p className="text-xs text-destructive">
                {errors.quantity.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Low Stock Threshold</Label>
            <Input
              type="number"
              {...register("lowStockThreshold", { valueAsNumber: true })}
            />
          </div>
        </div>
      </div>

      {/* Toggles */}
      <div className="space-y-4">
        <h2 className="font-semibold">Visibility &amp; Options</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Has Box</Label>
              <p className="text-[10px] text-muted-foreground">Does this item come with its original box?</p>
            </div>
            <Switch
              checked={watch("hasBox")}
              onCheckedChange={(v) => setValue("hasBox", v)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Active (Visible on Store)</Label>
              <p className="text-[10px] text-muted-foreground">Turn off to hide from the website without deleting</p>
            </div>
            <Switch
              checked={watch("isActive")}
              onCheckedChange={(v) => setValue("isActive", v)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Featured</Label>
              <p className="text-[10px] text-muted-foreground">Show on the homepage featured section</p>
            </div>
            <Switch
              checked={watch("isFeatured")}
              onCheckedChange={(v) => setValue("isFeatured", v)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>New Drop</Label>
              <p className="text-[10px] text-muted-foreground">Show in the &quot;New Drops&quot; section of the store</p>
            </div>
            <Switch
              checked={watch("isDrop")}
              onCheckedChange={(v) => setValue("isDrop", v)}
            />
          </div>
        </div>
      </div>

      {/* Size Variants — only for sneaker category */}
      {isSneaker && (
        <VariantSizeMatrix variants={variantRows} onChange={setVariantRows} />
      )}

      <Button type="submit" size="lg" className="w-full" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isEdit ? "Update Product" : "Create Product"}
      </Button>
    </form>
  );
}
