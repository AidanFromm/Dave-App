"use client";

import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWishlistStore } from "@/stores/wishlist-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface WishlistButtonProps {
  productId: string;
  productName: string;
}

export function WishlistButton({ productId, productName }: WishlistButtonProps) {
  const { isWishlisted, toggleProduct } = useWishlistStore();
  const wishlisted = isWishlisted(productId);

  const handleToggle = () => {
    toggleProduct(productId);
    if (!wishlisted) {
      toast.success(`${productName} added to wishlist`);
    } else {
      toast.info(`${productName} removed from wishlist`);
    }
  };

  return (
    <Button variant="outline" size="lg" className="w-full" onClick={handleToggle}>
      <Heart
        className={cn(
          "mr-2 h-4 w-4",
          wishlisted ? "fill-primary text-primary" : ""
        )}
      />
      {wishlisted ? "Wishlisted" : "Add to Wishlist"}
    </Button>
  );
}
