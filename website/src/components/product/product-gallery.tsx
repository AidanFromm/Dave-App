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
      <div className="flex aspect-square items-center justify-center rounded-2xl border border-border bg-white text-muted-foreground">
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
      <div className="space-y-3">
        {/* Main Image */}
        <motion.div
          className="relative aspect-square overflow-hidden rounded-2xl border border-border bg-white cursor-zoom-in group"
          onClick={() => openLightbox(selectedIndex)}
          whileHover={{ scale: 1.005 }}
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
                  "object-contain",
                  condition?.includes('used') ? "p-4 sm:p-6" : "p-6 sm:p-10"
                )}
                priority
              />
            </motion.div>
          </AnimatePresence>

          {/* Zoom indicator */}
          <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity">
            <ZoomIn className="h-3 w-3" />
            Click to zoom
          </div>

          {/* Navigation arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToImage(selectedIndex - 1);
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white shadow-md border border-border/50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToImage(selectedIndex + 1);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white shadow-md border border-border/50"
              >
                <ChevronRight className="h-4 w-4" />
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
                  "relative h-16 w-16 sm:h-[72px] sm:w-[72px] flex-shrink-0 overflow-hidden rounded-lg border bg-white transition-all",
                  i === selectedIndex
                    ? "border-primary ring-1 ring-primary"
                    : "border-border hover:border-primary/50"
                )}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <Image
                  src={img}
                  alt={`${name} - Thumbnail ${i + 1}`}
                  fill
                  sizes="72px"
                  className="object-contain p-1.5"
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
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-white border-0 shadow-2xl">
        <div className="relative">
          {/* Main image */}
          <div className="relative aspect-square bg-white">
            <AnimatePresence mode="wait">
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="absolute inset-0"
              >
                <Image
                  src={images[index]}
                  alt={`${name} - Image ${index + 1}`}
                  fill
                  sizes="90vw"
                  className="object-contain p-6 sm:p-10"
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
                className="absolute left-3 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-black/70 text-white hover:bg-black/80 shadow-lg transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => goToImage(index + 1)}
                className="absolute right-3 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-black/70 text-white hover:bg-black/80 shadow-lg transition-colors"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}

          {/* Image counter */}
          <div className="absolute top-3 left-3 rounded-full bg-black/70 px-2.5 py-1 text-xs font-medium text-white">
            {index + 1} / {images.length}
          </div>
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="flex justify-center gap-2 p-4 border-t border-border bg-neutral-50">
            {images.map((img, i) => (
              <motion.button
                key={i}
                onClick={() => setIndex(i)}
                className={cn(
                  "relative h-14 w-14 overflow-hidden rounded-md border bg-white transition-all",
                  i === index
                    ? "border-primary ring-1 ring-primary"
                    : "border-border hover:border-primary/50"
                )}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Image
                  src={img}
                  alt={`${name} - Thumbnail ${i + 1}`}
                  fill
                  sizes="56px"
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
