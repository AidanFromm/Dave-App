import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProduct, getProductSizeVariants } from "@/actions/products";
import { getVariantsForProduct } from "@/actions/variants";
import { ProductDetailClient } from "./product-detail-client";
import { formatCurrency } from "@/types/product";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) return { title: "Product Not Found" };

  return {
    title: product.name,
    description:
      product.description ??
      `${product.name} — ${formatCurrency(product.price)} at Secured Tampa`,
    openGraph: {
      title: product.name,
      description:
        product.description ??
        `${product.name} — ${formatCurrency(product.price)}`,
      images: product.images?.[0] ? [product.images[0]] : [],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();

  // Fetch proper variants from product_variants table
  const dbVariants = await getVariantsForProduct(id);

  // Fall back to legacy size variants (same-name products) if no real variants exist
  const sizeVariants = dbVariants.length > 0
    ? dbVariants.map((v) => ({
        id: v.id,
        size: v.size,
        price: v.price,
        condition: v.condition as "new" | "used_like_new" | "used_good" | "used_fair",
        quantity: v.quantity,
        variantCondition: v.condition,
      }))
    : await getProductSizeVariants(product);

  return <ProductDetailClient product={product} sizeVariants={sizeVariants} dbVariants={dbVariants} />;
}
