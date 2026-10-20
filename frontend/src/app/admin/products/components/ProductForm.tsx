"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Save, AlertCircle, Loader2, Sparkles } from "lucide-react";

interface CategoryItem {
  _id: string;
  name: string;
}

export interface ProductFormData {
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
  onSubmit: (data: ProductFormData) => Promise<void>;
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
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
  const [isFeatured, setIsFeatured] = useState(
    initialData?.isFeatured ?? false,
  );
  const [error, setError] = useState<string | null>(null);

  // Sync state if initialData loads asynchronously
  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setDescription(initialData.description || "");
      setPrice(initialData.price?.toString() || "");
      setDiscountPrice(initialData.discountPrice?.toString() || "");
      setCategory(initialData.category || "");
      setStock(initialData.stock?.toString() || "10");
      setImageUrls(initialData.images?.join("\n") || "");
      setIsActive(initialData.isActive ?? true);
      setIsFeatured(initialData.isFeatured ?? false);
    }
  }, [initialData]);

  // Fetch available categories
  const { data: categories, isLoading: isCategoriesLoading } = useQuery<
    CategoryItem[]
  >({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await api.get("/categories");
      return res.data?.categories || [];
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedPrice = parseFloat(price);
    const parsedDiscount = discountPrice
      ? parseFloat(discountPrice)
      : undefined;
    const parsedStock = parseInt(stock, 10);

    if (!name.trim()) {
      setError("Product title is required.");
      return;
    }
    if (!description.trim()) {
      setError("Product description is required.");
      return;
    }
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setError("Price must be a valid positive number.");
      return;
    }
    if (
      parsedDiscount !== undefined &&
      (isNaN(parsedDiscount) || parsedDiscount >= parsedPrice)
    ) {
      setError("Discount price must be less than the regular price.");
      return;
    }
    if (isNaN(parsedStock) || parsedStock < 0) {
      setError("Stock units cannot be negative.");
      return;
    }
    if (!category) {
      setError("Please select a product category.");
      return;
    }

    // Split image URLs by newline and remove empty lines
    const parsedImages = imageUrls
      .split("\n")
      .map((url) => url.trim())
      .filter((url) => url.length > 0);

    if (parsedImages.length === 0) {
      setError("Please provide at least one image URL.");
      return;
    }

    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim(),
        price: parsedPrice,
        discountPrice: parsedDiscount,
        category,
        stock: parsedStock,
        images: parsedImages,
        isActive,
        isFeatured,
      });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to save product.";
      setError(message);
    }
  };

  const previewImages = imageUrls
    .split("\n")
    .map((url) => url.trim())
    .filter((url) => url.length > 0);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-semibold text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Details: Left 2 Cols */}
        <div className="space-y-4 sm:space-y-6 lg:col-span-2">
          {/* General Information Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-2xs space-y-4 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3">
              General Product Information
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Product Title *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Keychron Q1 Pro Wireless Custom Mechanical Keyboard"
                className="mt-1 w-full rounded-lg border border-slate-300 py-2 px-3 text-xs outline-none focus:border-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-400 dark:focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Detailed Description *
              </label>
              <textarea
                rows={5}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe mechanical specifications, build quality, key features..."
                className="mt-1 w-full rounded-lg border border-slate-300 p-3 text-xs outline-none focus:border-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-400 dark:focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Pricing & Stock Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-2xs space-y-4 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3">
              Pricing & Warehouse Stock
            </h2>

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3 sm:gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Regular Price (₹) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="e.g. 17999"
                  className="mt-1 w-full rounded-lg border border-slate-300 py-2 px-3 text-xs outline-none focus:border-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-400 dark:focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Discount Price (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={discountPrice}
                  onChange={(e) => setDiscountPrice(e.target.value)}
                  placeholder="Optional sale price"
                  className="mt-1 w-full rounded-lg border border-slate-300 py-2 px-3 text-xs outline-none focus:border-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-400 dark:focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Stock Units (Live) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  placeholder="e.g. 25"
                  className="mt-1 w-full rounded-lg border border-slate-300 py-2 px-3 text-xs outline-none focus:border-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-400 dark:focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* Media Assets Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-2xs space-y-4 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3">
              Media Images (One URL per line)
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Image URLs (Direct HTTPS links) *
              </label>
              <textarea
                rows={4}
                required
                value={imageUrls}
                onChange={(e) => setImageUrls(e.target.value)}
                placeholder="https://images.unsplash.com/...&#10;https://images.unsplash.com/..."
                className="mt-1 font-mono text-[11px] sm:text-xs w-full rounded-lg border border-slate-300 p-2.5 outline-none focus:border-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-400 dark:focus:border-cyan-500"
              />
            </div>

            {previewImages.length > 0 && (
              <div>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-2">
                  Image Gallery Preview ({previewImages.length})
                </span>
                <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2">
                  {previewImages.map((img, i) => (
                    <div
                      key={i}
                      className="relative aspect-square h-16 w-16 sm:h-20 sm:w-20 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-800"
                    >
                      <img
                        src={img}
                        alt={`Preview ${i + 1}`}
                        className="h-full w-full object-cover object-center"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Controls: Right Col */}
        <div className="space-y-4 sm:space-y-6">
          {/* Classification & Organization */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-2xs space-y-4 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3">
              Catalog Organization
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Product Category *
              </label>
              <select
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={isCategoriesLoading}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white py-2 px-3 text-xs font-medium text-slate-700 outline-none focus:border-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:focus:border-cyan-500"
              >
                <option value="" className="dark:bg-slate-900">
                  Select Category
                </option>
                {categories?.map((c) => (
                  <option
                    key={c._id}
                    value={c._id}
                    className="dark:bg-slate-900"
                  >
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Visibility Controls */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-2xs space-y-4 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3">
              Storefront Visibility
            </h2>

            <div className="space-y-3">
              <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-3 cursor-pointer hover:bg-slate-50 transition dark:border-slate-700 dark:bg-slate-800/60 dark:hover:bg-slate-800">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded text-blue-600 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Active in Storefront
                  </span>
                  <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                    When disabled, the product will be hidden from search and
                    catalog.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-3 cursor-pointer hover:bg-slate-50 transition dark:border-slate-700 dark:bg-slate-800/60 dark:hover:bg-slate-800">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded text-blue-600 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                    <span>Featured Product</span>
                  </span>
                  <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                    Showcase this item on the homepage featured carousel.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="space-y-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 px-4 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-500 focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 transition disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving Product...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>
                    {isEditing ? "Update Product" : "Publish to Catalog"}
                  </span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => router.push("/admin/products")}
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};
