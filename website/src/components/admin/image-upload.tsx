"use client";

import { useState, useCallback, useRef } from "react";
import { X, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
}

export function ImageUpload({ images, onChange, maxImages = 6 }: ImageUploadProps) {
  const [uploadingCount, setUploadingCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const remaining = maxImages - images.length;
      if (remaining <= 0) {
        toast.error(`Maximum ${maxImages} images allowed`);
        return;
      }
      const toUpload = fileArray.slice(0, remaining);
      setUploadingCount(toUpload.length);

      try {
        const formData = new FormData();
        toUpload.forEach((f) => formData.append("images", f));

        const res = await fetch("/api/upload/image", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();

        if (data.error) {
          toast.error(data.error);
          return;
        }

        onChange([...images, ...data.urls]);
      } catch {
        toast.error("Upload failed");
      } finally {
        setUploadingCount(0);
      }
    },
    [images, onChange, maxImages]
  );

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  const handleAddClick = () => {
    if (images.length >= maxImages) {
      toast.error(`Maximum ${maxImages} images allowed`);
      return;
    }
    fileInputRef.current?.click();
  };

  // Build slots: existing images + uploading placeholders + add button
  const slots: ("image" | "uploading" | "add")[] = [];
  images.forEach(() => slots.push("image"));
  for (let u = 0; u < uploadingCount; u++) slots.push("uploading");
  if (slots.length < maxImages) slots.push("add");

  return (
    <div>
      <div className="grid grid-cols-3 gap-2">
        {slots.map((type, i) => {
          if (type === "image") {
            return (
              <div
                key={images[i]}
                className="relative aspect-square overflow-hidden rounded-lg border border-border bg-muted/20"
              >
                <img
                  src={images[i]}
                  alt={`Photo ${i + 1}`}
                  className="h-full w-full object-contain p-1"
                />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 active:bg-black/90"
                >
                  <X className="h-4 w-4 text-white" />
                </button>
                {i === 0 && (
                  <span className="absolute bottom-1 left-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                    Main
                  </span>
                )}
              </div>
            );
          }

          if (type === "uploading") {
            return (
              <div
                key={`uploading-${i}`}
                className="flex aspect-square items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/10"
              >
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            );
          }

          // "add" slot
          return (
            <button
              key="add"
              type="button"
              onClick={handleAddClick}
              className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border bg-muted/10 transition-colors hover:border-muted-foreground hover:bg-muted/20 active:bg-muted/30"
            >
              <Plus className="h-8 w-8 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {images.length}/{maxImages}
              </span>
            </button>
          );
        })}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) {
            uploadFiles(e.target.files);
            e.target.value = "";
          }
        }}
      />
    </div>
  );
}
