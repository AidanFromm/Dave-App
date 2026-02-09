"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Home, Search, ArrowLeft, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      {/* Animated 404 */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative"
      >
        <motion.span 
          className="text-[150px] sm:text-[200px] font-black text-muted/30 select-none"
          animate={{ 
            textShadow: [
              "0 0 20px rgba(var(--primary), 0.1)",
              "0 0 40px rgba(var(--primary), 0.2)",
              "0 0 20px rgba(var(--primary), 0.1)",
            ]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          404
        </motion.span>
        
        {/* Sneaker emoji overlay */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <span className="text-6xl sm:text-8xl">👟</span>
        </motion.div>
      </motion.div>

      {/* Message */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="mt-2"
      >
        <h1 className="text-2xl sm:text-3xl font-bold">
          Oops! This page took an L
        </h1>
        <p className="mt-3 text-muted-foreground max-w-md mx-auto">
          The page you&apos;re looking for doesn&apos;t exist or has been moved. 
          Let&apos;s get you back to the heat.
        </p>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="mt-8 flex flex-col sm:flex-row gap-3"
      >
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
      </motion.div>

      {/* Popular Links */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="mt-12 text-sm text-muted-foreground"
      >
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
      </motion.div>
    </div>
  );
}
