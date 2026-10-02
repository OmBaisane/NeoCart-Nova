"use client";

import { useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ProductForm, ProductFormData } from "../../components/ProductForm";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";

interface AdminProductDetails {
  _id: string;
  name: string;
  description: string;
  price: number;
  discountPrice?: number;
  category?: { _id: string; name: string } | string;
  stock: number;
  images: string[];
  isActive: boolean;
  isFeatured: boolean;
}

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
  } = useQuery<AdminProductDetails>({
    queryKey: ["admin-edit-product", id],
    queryFn: async () => {
      const res = await api.get(`/products?limit=100`);
      const found = res.data?.products?.find(
        (p: AdminProductDetails) => p._id === id,
      );
      if (!found) throw new Error("Product not found");
      return found;
    },
  });

  const handleUpdate = async (payload: ProductFormData) => {
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
      <main className="mx-auto max-w-4xl p-8 sm:p-12 text-center">
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

  // Guaranteed string type fallback
  const resolvedCategory: string =
    typeof product.category === "object" && product.category !== null
      ? product.category._id || ""
      : typeof product.category === "string"
        ? product.category
        : "";

  const initialData: ProductFormData = {
    name: product.name,
    description: product.description,
    price: product.price,
    discountPrice: product.discountPrice,
    category: resolvedCategory,
    stock: product.stock,
    images: product.images || [],
    isActive: product.isActive,
    isFeatured: product.isFeatured,
  };

  return (
    <main className="space-y-4 sm:space-y-6">
      <div className="flex items-center gap-2.5 sm:gap-3 border-b border-slate-200 pb-4 sm:pb-6">
        <Link
          href="/admin/products"
          className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 hover:text-brand-blue shrink-0"
          aria-label="Back to inventory"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="min-w-0">
          <h1 className="text-lg sm:text-2xl font-extrabold tracking-tight text-brand-charcoal truncate">
            Edit: {product.name}
          </h1>
          <p className="mt-0.5 text-[11px] sm:text-xs text-slate-500">
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
