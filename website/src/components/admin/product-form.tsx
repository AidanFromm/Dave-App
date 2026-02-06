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
import { useState } from "react";
import { toast } from "sonner";

interface ProductFormProps {
  product?: Product;
  categories: Category[];
}

export function ProductForm({ product, categories }: ProductFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const isEdit = !!product;

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
        toast.success("Product updated");
        router.push("/admin/products");
        router.refresh();
      }
    } else {
      const result = await createProduct(payload);
      if (result.error) {
        toast.error(result.error);
      } else {
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
        <h2 className="font-semibold">Product Info</h2>
        <div className="space-y-2">
          <Label>Name *</Label>
          <Input {...register("name")} />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea {...register("description")} rows={3} />
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
            <Input {...register("brand")} />
          </div>
          <div className="space-y-2">
            <Label>SKU</Label>
            <Input {...register("sku")} />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-2">
            <Label>Barcode</Label>
            <Input {...register("barcode")} />
          </div>
          <div className="space-y-2">
            <Label>Size</Label>
            <Input {...register("size")} />
          </div>
          <div className="space-y-2">
            <Label>Colorway</Label>
            <Input {...register("colorway")} />
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
              <SelectItem value="used_like_new">Like New</SelectItem>
              <SelectItem value="used_good">Good</SelectItem>
              <SelectItem value="used_fair">Fair</SelectItem>
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
        <h2 className="font-semibold">Pricing</h2>
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
        <h2 className="font-semibold">Inventory</h2>
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
        <h2 className="font-semibold">Settings</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Has Box</Label>
            <Switch
              checked={watch("hasBox")}
              onCheckedChange={(v) => setValue("hasBox", v)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Active</Label>
            <Switch
              checked={watch("isActive")}
              onCheckedChange={(v) => setValue("isActive", v)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Featured</Label>
            <Switch
              checked={watch("isFeatured")}
              onCheckedChange={(v) => setValue("isFeatured", v)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>New Drop</Label>
            <Switch
              checked={watch("isDrop")}
              onCheckedChange={(v) => setValue("isDrop", v)}
            />
          </div>
        </div>
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isEdit ? "Update Product" : "Create Product"}
      </Button>
    </form>
  );
}
