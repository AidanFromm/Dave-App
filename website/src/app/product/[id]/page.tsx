import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProduct } from "@/actions/products";
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

  return <ProductDetailClient product={product} />;
}
