"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Props {
  productId: string;
  productName: string;
}

export function DeleteProductButton({ productId, productName }: Props) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/products", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Delete failed");
      }
      toast.success(`${productName} deleted`);
      router.push("/admin/products");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to delete product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="border-red-500/50 text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
        onClick={() => setShowConfirm(true)}
      >
        <Trash2 className="mr-1.5 h-4 w-4" />
        Delete
      </Button>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Delete Product</h3>
                <p className="text-sm text-muted-foreground">This cannot be undone.</p>
              </div>
            </div>
            <p className="mt-4 text-sm">
              Are you sure you want to delete <strong>{productName}</strong>? This cannot be undone.
            </p>
            <div className="mt-6 flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowConfirm(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={handleDelete}
                disabled={loading}
              >
                {loading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Trash2 className="mr-1.5 h-4 w-4" />}
                {loading ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
