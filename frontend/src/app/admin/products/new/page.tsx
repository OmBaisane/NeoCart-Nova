"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ProductForm } from "../components/ProductForm";
import { ArrowLeft } from "lucide-react";

interface CreateProductPayload {
  name: string;
  description: string;
  price: number;
  discountPrice?: number;
  stock: number;
  category: string;
  images: string[];
  isFeatured?: boolean;
  isActive?: boolean;
}

export default function NewProductPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async (
    payload: CreateProductPayload | Record<string, unknown>,
  ) => {
    setIsSubmitting(true);
    try {
      await api.post("/products", payload);
      queryClient.invalidateQueries({ queryKey: ["admin-products-list"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      router.push("/admin/products");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="space-y-4 sm:space-y-6">
      <div className="flex items-center gap-2.5 sm:gap-3 border-b border-slate-200 pb-4 sm:pb-6 dark:border-slate-800">
        <Link
          href="/admin/products"
          className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 hover:text-brand-blue shrink-0 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-cyan-400"
          aria-label="Back to products list"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="min-w-0">
          <h1 className="text-lg sm:text-2xl font-extrabold tracking-tight text-brand-charcoal dark:text-white truncate">
            Add New Product Entry
          </h1>
          <p className="mt-0.5 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
            Publish a new verified inventory item to the NeoCart Nova
            storefront.
          </p>
        </div>
      </div>

      <ProductForm onSubmit={handleCreate} isSubmitting={isSubmitting} />
    </main>
  );
}
