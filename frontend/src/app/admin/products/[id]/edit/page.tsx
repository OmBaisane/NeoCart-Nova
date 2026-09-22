"use client";

import React, { useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ProductForm } from "../../components/ProductForm";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch existing product data
  const {
    data: product,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["admin-edit-product", id],
    queryFn: async () => {
      // Find product by id from product list
      const res = await api.get(`/products?limit=100`);
      const found = res.data?.products?.find((p: any) => p._id === id);
      if (!found) throw new Error("Product not found");
      return found;
    },
  });

  const handleUpdate = async (payload: any) => {
    setIsSubmitting(true);
    try {
      await api.patch(`/products/${id}`, payload);
      queryClient.invalidateQueries({ queryKey: ["admin-products-list"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      router.push("/admin/products");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
      </div>
    );
  }

  if (isError || !product) {
    return (
      <main className="mx-auto max-w-4xl p-12 text-center">
        <AlertCircle className="mx-auto h-10 w-10 text-rose-500" />
        <h2 className="mt-3 text-base font-bold text-brand-charcoal">
          Product Not Found
        </h2>
        <Link
          href="/admin/products"
          className="mt-4 inline-block text-xs font-semibold text-brand-blue hover:underline"
        >
          Back to Inventory
        </Link>
      </main>
    );
  }

  const initialData = {
    name: product.name,
    description: product.description,
    price: product.price,
    discountPrice: product.discountPrice,
    category: product.category?._id || product.category,
    stock: product.stock,
    images: product.images,
    isActive: product.isActive,
    isFeatured: product.isFeatured,
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
            Edit Product: {product.name}
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Modify catalog pricing, adjust live stock units, or update media
            assets.
          </p>
        </div>
      </div>

      <ProductForm
        initialData={initialData}
        productId={id}
        isEditing={true}
        onSubmit={handleUpdate}
        isSubmitting={isSubmitting}
      />
    </main>
  );
}
