"use client";

import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, GripVertical, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
}

export function ImageUpload({ images, onChange, maxImages = 6 }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const remaining = maxImages - images.length;

      if (remaining <= 0) {
        toast.error(`Maximum ${maxImages} images allowed`);
        return;
      }

      const toUpload = fileArray.slice(0, remaining);
      setUploading(true);

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
        setUploading(false);
      }
    },
    [images, onChange, maxImages]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length) {
        uploadFiles(e.dataTransfer.files);
      }
    },
    [uploadFiles]
  );

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      {/* Preview grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {images.map((url, i) => (
            <div
              key={url}
              className="group relative aspect-square overflow-hidden rounded-lg border border-border"
            >
              <img
                src={url}
                alt={`Product ${i + 1}`}
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute right-1 top-1 rounded-full bg-black/60 p-1 opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X className="h-3 w-3 text-white" />
              </button>
              {i === 0 && (
                <span className="absolute bottom-1 left-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                  Main
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      {images.length < maxImages && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors ${
            dragOver
              ? "border-primary bg-primary/5"
              : "border-border hover:border-muted-foreground"
          }`}
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          ) : (
            <>
              <Upload className="h-6 w-6 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                Drop images here or click to browse
              </p>
              <p className="text-xs text-muted-foreground/60">
                JPEG, PNG, WebP up to 5MB ({images.length}/{maxImages})
              </p>
            </>
          )}
        </div>
      )}

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
