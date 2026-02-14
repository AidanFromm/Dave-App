"use client";

import Image from "next/image";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductGalleryProps {
  images: string[];
  name: string;
  condition?: string;
}

export function ProductGallery({ images, name, condition }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  if (!images.length) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        No Image
      </div>
    );
  }

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const goToImage = (index: number) => {
    if (index < 0) index = images.length - 1;
    if (index >= images.length) index = 0;
    setSelectedIndex(index);
  };

  return (
    <>
      <div className="space-y-4">
        {/* Main Image */}
        <motion.div
          className="relative aspect-square overflow-hidden rounded-2xl bg-gradient-to-br from-muted/60 to-muted/30 cursor-zoom-in group"
          onClick={() => openLightbox(selectedIndex)}
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.2 }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative h-full w-full"
            >
              <Image
                src={images[selectedIndex]}
                alt={`${name} - Image ${selectedIndex + 1}`}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className={cn(
                  condition?.includes('used') ? "object-cover" : "object-contain p-8 sm:p-12"
                )}
                priority
              />
            </motion.div>
          </AnimatePresence>

          {/* Zoom indicator */}
          <div className="absolute bottom-4 right-4 flex items-center gap-2 rounded-full bg-background/80 px-3 py-1.5 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
            <ZoomIn className="h-3.5 w-3.5" />
            Click to zoom
          </div>

          {/* Navigation arrows (desktop) */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToImage(selectedIndex - 1);
                }}
                className="absolute left-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-background/80 text-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background shadow-lg backdrop-blur-sm"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToImage(selectedIndex + 1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-background/80 text-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background shadow-lg backdrop-blur-sm"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
        </motion.div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {images.map((img, i) => (
              <motion.button
                key={i}
                onClick={() => setSelectedIndex(i)}
                className={cn(
                  "relative h-16 w-16 sm:h-20 sm:w-20 flex-shrink-0 overflow-hidden rounded-xl bg-muted/50 transition-all",
                  i === selectedIndex
                    ? "ring-2 ring-primary ring-offset-2"
                    : "opacity-60 hover:opacity-100"
                )}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Image
                  src={img}
                  alt={`${name} - Thumbnail ${i + 1}`}
                  fill
                  sizes="80px"
                  className="object-contain p-1"
                />
              </motion.button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      <Lightbox
        images={images}
        name={name}
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
        index={lightboxIndex}
        setIndex={setLightboxIndex}
      />
    </>
  );
}

function Lightbox({
  images,
  name,
  open,
  onOpenChange,
  index,
  setIndex,
}: {
  images: string[];
  name: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  index: number;
  setIndex: (i: number) => void;
}) {
  const goToImage = (newIndex: number) => {
    if (newIndex < 0) newIndex = images.length - 1;
    if (newIndex >= images.length) newIndex = 0;
    setIndex(newIndex);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-background/95 backdrop-blur-xl border-0">
        <div className="relative">
          {/* Main image */}
          <div className="relative aspect-square">
            <AnimatePresence mode="wait">
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0"
              >
                <Image
                  src={images[index]}
                  alt={`${name} - Image ${index + 1}`}
                  fill
                  sizes="90vw"
                  className="object-contain p-8"
                  priority
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={() => goToImage(index - 1)}
                className="absolute left-4 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-background/80 text-foreground hover:bg-background shadow-lg transition-colors"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={() => goToImage(index + 1)}
                className="absolute right-4 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-background/80 text-foreground hover:bg-background shadow-lg transition-colors"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          {/* Image counter */}
          <div className="absolute top-4 left-4 rounded-full bg-background/80 px-3 py-1.5 text-sm font-medium backdrop-blur-sm">
            {index + 1} / {images.length}
          </div>
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="flex justify-center gap-2 p-4 bg-muted/50">
            {images.map((img, i) => (
              <motion.button
                key={i}
                onClick={() => setIndex(i)}
                className={cn(
                  "relative h-16 w-16 overflow-hidden rounded-lg transition-all",
                  i === index
                    ? "ring-2 ring-primary ring-offset-2"
                    : "opacity-50 hover:opacity-100"
                )}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Image
                  src={img}
                  alt={`${name} - Thumbnail ${i + 1}`}
                  fill
                  sizes="64px"
                  className="object-contain p-1"
                />
              </motion.button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
