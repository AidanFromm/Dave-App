import Link from "next/link";
import { Home, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <div className="relative">
        <span className="text-[150px] sm:text-[200px] font-black text-muted/30 select-none">
          404
        </span>
        <div className="absolute inset-0 flex items-center justify-center">
          <ShoppingBag className="w-16 h-16 sm:w-24 sm:h-24 text-muted-foreground" />
        </div>
      </div>

      <div className="mt-2">
        <h1 className="text-2xl sm:text-3xl font-bold">
          Oops! This page took an L
        </h1>
        <p className="mt-3 text-muted-foreground max-w-md mx-auto">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
          Let&apos;s get you back to the heat.
        </p>
      </div>

      <div className="mt-8 flex flex-col sm:flex-row gap-3">
        <Button size="lg" asChild>
          <Link href="/">
            <Home className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>
        <Button size="lg" variant="outline" asChild>
          <Link href="/?filter=all">
            <ShoppingBag className="mr-2 h-4 w-4" />
            Browse Shop
          </Link>
        </Button>
      </div>

      <div className="mt-12 text-sm text-muted-foreground">
        <p className="mb-3">Popular destinations:</p>
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
          <Link href="/drops" className="hover:text-primary transition-colors">
            New Drops
          </Link>
          <span>•</span>
          <Link href="/?filter=sneakers" className="hover:text-primary transition-colors">
            Sneakers
          </Link>
          <span>•</span>
          <Link href="/?filter=pokemon" className="hover:text-primary transition-colors">
            Pokémon
          </Link>
          <span>•</span>
          <Link href="/orders/lookup" className="hover:text-primary transition-colors">
            Track Order
          </Link>
        </div>
      </div>
    </div>
  );
}
