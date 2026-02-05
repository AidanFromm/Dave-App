import { ProductGridSkeleton } from "@/components/product/product-grid-skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="h-8 w-32 animate-pulse rounded bg-muted" />
      <div className="mt-6">
        <ProductGridSkeleton />
      </div>
    </div>
  );
}
