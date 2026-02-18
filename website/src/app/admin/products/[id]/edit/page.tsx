import { notFound } from "next/navigation";
import { getProduct, getCategories } from "@/actions/products";
import { getVariantsForProduct } from "@/actions/variants";
import { ProductForm } from "@/components/admin/product-form";
import { DeleteProductButton } from "@/components/admin/delete-product-button";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;
  const [product, categories, variants] = await Promise.all([
    getProduct(id),
    getCategories(),
    getVariantsForProduct(id),
  ]);

  if (!product) notFound();

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Edit Product</h1>
        <DeleteProductButton productId={product.id} productName={product.name} />
      </div>
      <div className="mt-6">
        <ProductForm product={product} categories={categories} existingVariants={variants} />
      </div>
    </div>
  );
}
