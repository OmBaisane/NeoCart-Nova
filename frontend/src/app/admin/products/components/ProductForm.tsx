"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Save,
  ArrowLeft,
  AlertCircle,
  Loader2,
  Check,
  Sparkles,
  Eye,
} from "lucide-react";

interface CategoryItem {
  _id: string;
  name: string;
}

interface ProductFormData {
  name: string;
  description: string;
  price: number;
  discountPrice?: number;
  category: string;
  stock: number;
  images: string[];
  isActive: boolean;
  isFeatured: boolean;
}

interface ProductFormProps {
  initialData?: ProductFormData;
  productId?: string;
  isEditing?: boolean;
  onSubmit: (data: any) => Promise<void>;
  isSubmitting: boolean;
}

export const ProductForm: React.FC<ProductFormProps> = ({
  initialData,
  isEditing = false,
  onSubmit,
  isSubmitting,
}) => {
  const router = useRouter();

  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(
    initialData?.description || "",
  );
  const [price, setPrice] = useState(initialData?.price?.toString() || "");
  const [discountPrice, setDiscountPrice] = useState(
    initialData?.discountPrice?.toString() || "",
  );
  const [category, setCategory] = useState(initialData?.category || "");
  const [stock, setStock] = useState(initialData?.stock?.toString() || "10");
  const [imageUrls, setImageUrls] = useState(
    initialData?.images?.join("\n") || "",
  );
  const [isActive, setIsActive] = useState(
    initialData?.isActive !== undefined ? initialData.isActive : true,
  );
  const [isFeatured, setIsFeatured] = useState(
    initialData?.isFeatured !== undefined ? initialData.isFeatured : false,
  );
  const [error, setError] = useState<string | null>(null);

  // Fetch categories for dropdown
  const { data: categories } = useQuery<CategoryItem[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await api.get("/categories");
      return res.data?.categories;
    },
  });

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setDescription(initialData.description || "");
      setPrice(initialData.price?.toString() || "");
      setDiscountPrice(initialData.discountPrice?.toString() || "");
      setCategory(initialData.category || "");
      setStock(initialData.stock?.toString() || "0");
      setImageUrls(initialData.images?.join("\n") || "");
      setIsActive(initialData.isActive);
      setIsFeatured(initialData.isFeatured);
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (name.trim().length < 2) {
      setError("Product title must be at least 2 characters.");
      return;
    }

    if (!price || parseFloat(price) <= 0) {
      setError("Please provide a valid regular price.");
      return;
    }

    if (!category) {
      setError("Please assign a product category.");
      return;
    }

    const imagesArray = imageUrls
      .split("\n")
      .map((url) => url.trim())
      .filter((url) => url.length > 0);

    if (imagesArray.length === 0) {
      setError("Please provide at least one product image URL.");
      return;
    }

    const payload = {
      name: name.trim(),
      description: description.trim(),
      price: parseFloat(price),
      discountPrice: discountPrice ? parseFloat(discountPrice) : undefined,
      category,
      stock: parseInt(stock, 10) || 0,
      images: imagesArray,
      isActive,
      isFeatured,
    };

    try {
      await onSubmit(payload);
    } catch (err: any) {
      setError(err.message || "Failed to save product.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl">
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main details card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-6">
        <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-3">
          1. General Information
        </h2>

        <div>
          <label className="block text-xs font-semibold text-slate-700">
            Product Title *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Nova Pro Wireless ANC Headphones"
            className="mt-1 w-full rounded-lg border border-slate-300 py-2.5 px-3 text-xs outline-none focus:border-brand-blue"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700">
            Description *
          </label>
          <textarea
            rows={4}
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detailed specifications, warranty details, build quality..."
            className="mt-1 w-full rounded-lg border border-slate-300 py-2.5 px-3 text-xs outline-none focus:border-brand-blue"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700">
            Category *
          </label>
          <select
            required
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 py-2.5 px-3 text-xs outline-none focus:border-brand-blue bg-white"
          >
            <option value="">Select a category...</option>
            {categories?.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Pricing & Warehouse Stock Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-6">
        <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-3">
          2. Inventory & Valuation
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Regular Price (₹) *
            </label>
            <input
              type="number"
              required
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="14999"
              className="mt-1 w-full rounded-lg border border-slate-300 py-2.5 px-3 text-xs outline-none focus:border-brand-blue"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Discounted Price (₹) (Optional)
            </label>
            <input
              type="number"
              min="0"
              value={discountPrice}
              onChange={(e) => setDiscountPrice(e.target.value)}
              placeholder="11999"
              className="mt-1 w-full rounded-lg border border-slate-300 py-2.5 px-3 text-xs outline-none focus:border-brand-blue"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Warehouse Stock Units *
            </label>
            <input
              type="number"
              required
              min="0"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              placeholder="25"
              className="mt-1 w-full rounded-lg border border-slate-300 py-2.5 px-3 text-xs outline-none focus:border-brand-blue"
            />
          </div>
        </div>
      </div>

      {/* Media & Visibility Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-6">
        <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-3">
          3. Media Assets & Store Visibility
        </h2>

        <div>
          <label className="block text-xs font-semibold text-slate-700">
            Image URLs (One per line) *
          </label>
          <textarea
            rows={3}
            required
            value={imageUrls}
            onChange={(e) => setImageUrls(e.target.value)}
            placeholder="https://images.unsplash.com/photo-...\nhttps://images.unsplash.com/photo-..."
            className="mt-1 w-full rounded-lg border border-slate-300 py-2 px-3 text-xs outline-none focus:border-brand-blue font-mono"
          />
          <p className="mt-1 text-[11px] text-slate-400">
            First URL will serve as the primary storefront thumbnail.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-6 pt-2">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-brand-blue focus:ring-brand-blue"
            />
            <Eye className="h-4 w-4 text-slate-400" />
            <span>Active & Published in Catalog</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-brand-blue focus:ring-brand-blue"
            />
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span>Showcase in Featured Products</span>
          </label>
        </div>
      </div>

      {/* Form CTA Buttons */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 rounded-xl bg-brand-blue px-6 py-3 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-600 transition disabled:opacity-60"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          <span>{isEditing ? "Save Changes" : "Create Product Entry"}</span>
        </button>

        <button
          type="button"
          onClick={() => router.push("/admin/products")}
          className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};
