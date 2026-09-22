"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ProductForm } from "../components/ProductForm";
import { ArrowLeft } from "lucide-react";

export default function NewProductPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async (payload: any) => {
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
    <main className="space-y-6">
      <div className="flex items-center gap-3 border-b border-slate-200 pb-6">
        <Link
          href="/admin/products"
          className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 hover:text-brand-blue"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-brand-charcoal">
            Add New Product Entry
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Publish a new verified inventory item to the NeoCart Nova
            storefront.
          </p>
        </div>
      </div>

      <ProductForm onSubmit={handleCreate} isSubmitting={isSubmitting} />
    </main>
  );
}
