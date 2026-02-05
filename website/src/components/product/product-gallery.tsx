"use client";

import Image from "next/image";
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface ProductGalleryProps {
  images: string[];
  name: string;
}

export function ProductGallery({ images, name }: ProductGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  if (!images.length) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-xl bg-muted text-muted-foreground">
        No Image
      </div>
    );
  }

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  // Single image — full width
  if (images.length === 1) {
    return (
      <>
        {/* Mobile: horizontal scroll */}
        <div className="md:hidden">
          <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
            <Image
              src={images[0]}
              alt={`${name} - Image 1`}
              fill
              sizes="100vw"
              className="cursor-pointer object-cover"
              priority
              onClick={() => openLightbox(0)}
            />
          </div>
        </div>

        {/* Desktop: full-width single image */}
        <div className="hidden md:block">
          <div
            className="relative aspect-square overflow-hidden rounded-xl bg-muted cursor-pointer"
            onClick={() => openLightbox(0)}
          >
            <Image
              src={images[0]}
              alt={`${name} - Image 1`}
              fill
              sizes="50vw"
              className="object-cover"
              priority
            />
          </div>
        </div>

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

  return (
    <>
      {/* Mobile: horizontal scroll carousel */}
      <div className="md:hidden">
        <div className="flex gap-2 overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-4 px-4">
          {images.map((img, i) => (
            <div
              key={i}
              className="relative aspect-square w-[85vw] flex-shrink-0 snap-center overflow-hidden rounded-xl bg-muted cursor-pointer"
              onClick={() => openLightbox(i)}
            >
              <Image
                src={img}
                alt={`${name} - Image ${i + 1}`}
                fill
                sizes="85vw"
                className="object-cover"
                priority={i === 0}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Desktop: 2-column grid */}
      <div className="hidden md:grid md:grid-cols-2 md:gap-2">
        {images.map((img, i) => {
          // Last image spans both columns if odd count
          const isLast = i === images.length - 1;
          const isOddCount = images.length % 2 !== 0;
          const spanBoth = isLast && isOddCount;

          return (
            <div
              key={i}
              className={cn(
                "relative aspect-square overflow-hidden rounded-xl bg-muted cursor-pointer",
                spanBoth && "col-span-2"
              )}
              onClick={() => openLightbox(i)}
            >
              <Image
                src={img}
                alt={`${name} - Image ${i + 1}`}
                fill
                sizes={spanBoth ? "50vw" : "25vw"}
                className="object-cover transition-opacity hover:opacity-90"
                priority={i === 0}
              />
            </div>
          );
        })}
      </div>

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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden bg-background">
        <div className="relative aspect-square">
          <Image
            src={images[index]}
            alt={`${name} - Image ${index + 1}`}
            fill
            sizes="90vw"
            className="object-contain"
          />
        </div>
        {images.length > 1 && (
          <div className="flex justify-center gap-2 p-3">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className={cn(
                  "relative h-12 w-12 overflow-hidden rounded-md border-2 transition-colors",
                  i === index
                    ? "border-primary"
                    : "border-transparent hover:border-muted-foreground/30"
                )}
              >
                <Image
                  src={img}
                  alt={`${name} - Thumbnail ${i + 1}`}
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
