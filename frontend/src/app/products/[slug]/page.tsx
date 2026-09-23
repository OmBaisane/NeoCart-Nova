"use client";

import React, { useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { ProductItem } from "@/components/ui/ProductCard";
import {
  Star,
  ShoppingCart,
  ShieldCheck,
  Truck,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Loader2,
  ChevronRight,
  Plus,
  Minus,
  MessageSquare,
  XCircle,
} from "lucide-react";

interface ReviewItem {
  _id: string;
  rating: number;
  comment: string;
  user: {
    _id: string;
    name: string;
    avatar?: string;
  };
  createdAt: string;
}

export default function ProductDetailsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [cartSuccess, setCartSuccess] = useState(false);
  const [cartError, setCartError] = useState<string | null>(null);

  // Review Form States
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewError, setReviewError] = useState<string | null>(null);

  // 1. Fetch Product by Slug
  const {
    data: product,
    isLoading: isProductLoading,
    error: productError,
  } = useQuery<ProductItem>({
    queryKey: ["product", slug],
    queryFn: async () => {
      const res = await api.get(`/products/${slug}`);
      return res.data?.product;
    },
  });

  // 2. Fetch Product Reviews
  const { data: reviewsData, isLoading: isReviewsLoading } = useQuery<{
    reviews: ReviewItem[];
    count: number;
  }>({
    queryKey: ["reviews", product?._id],
    queryFn: async () => {
      if (!product?._id) return { reviews: [], count: 0 };
      const res = await api.get(`/products/${product._id}/reviews`);
      return res.data;
    },
    enabled: !!product?._id,
  });

  // 3. Add to Cart Mutation
  const addToCartMutation = useMutation({
    mutationFn: async () => {
      if (!product) return;
      return api.post("/cart/items", {
        productId: product._id,
        quantity,
      });
    },
    onSuccess: () => {
      setCartSuccess(true);
      setCartError(null);
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      setTimeout(() => setCartSuccess(false), 3500);
    },
    onError: (err: any) => {
      setCartError(
        err.response?.data?.message ||
          err.message ||
          "Failed to add item to cart",
      );
    },
  });

  // 4. Submit Review Mutation
  const submitReviewMutation = useMutation({
    mutationFn: async () => {
      if (!product) return;
      return api.post(`/products/${product._id}/reviews`, {
        rating: reviewRating,
        comment: reviewComment.trim(),
      });
    },
    onSuccess: () => {
      setReviewComment("");
      setReviewRating(5);
      setReviewError(null);
      queryClient.invalidateQueries({ queryKey: ["reviews", product?._id] });
      queryClient.invalidateQueries({ queryKey: ["product", slug] });
    },
    onError: (err: any) => {
      setReviewError(
        err.response?.data?.message || err.message || "Failed to submit review",
      );
    },
  });

  const handleAddToCart = () => {
    if (!user) {
      router.push(`/login?redirect=/products/${slug}`);
      return;
    }
    setCartError(null);
    addToCartMutation.mutate();
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push(`/login?redirect=/products/${slug}`);
      return;
    }
    if (reviewComment.trim().length < 3) {
      setReviewError("Comment must be at least 3 characters long.");
      return;
    }
    submitReviewMutation.mutate();
  };

  if (isProductLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
      </div>
    );
  }

  if (productError || !product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-rose-500" />
        <h1 className="mt-4 text-2xl font-bold text-brand-charcoal">
          Product Not Found
        </h1>
        <p className="mt-2 text-xs text-slate-500">
          The requested product could not be located or is no longer active.
        </p>
        <Link
          href="/products"
          className="mt-6 inline-block rounded-lg bg-brand-blue px-4 py-2 text-xs font-semibold text-white hover:bg-blue-600"
        >
          Back to Catalog
        </Link>
      </div>
    );
  }

  const hasDiscount =
    product.discountPrice !== undefined &&
    product.discountPrice > 0 &&
    product.discountPrice < product.price;

  const currentPrice = hasDiscount ? product.discountPrice! : product.price;
  const isOutOfStock = product.stock <= 0;
  const activeImage =
    selectedImage ||
    product.images[0] ||
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80";

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb Navigation */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-8"
      >
        <Link href="/" className="hover:text-brand-blue">
          Home
        </Link>
        <ChevronRight className="h-3 w-3 text-slate-400" />
        <Link href="/products" className="hover:text-brand-blue">
          Products
        </Link>
        <ChevronRight className="h-3 w-3 text-slate-400" />
        <span className="text-brand-charcoal truncate max-w-xs">
          {product.name}
        </span>
      </nav>

      {/* Main Product Layout */}
      <section className="grid grid-cols-1 gap-12 lg:grid-cols-2">
        {/* Left: Product Images */}
        <div className="space-y-4">
          <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <img
              src={activeImage}
              alt={product.name}
              className="h-full w-full object-cover object-center"
            />
            {hasDiscount && (
              <span className="absolute top-4 left-4 rounded-full bg-rose-600 px-3 py-1 text-xs font-bold text-white shadow-sm">
                SAVE ₹{product.price - product.discountPrice!}
              </span>
            )}
          </div>

          {/* Thumbnails */}
          {product.images && product.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img)}
                  className={`relative aspect-square h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 transition ${
                    activeImage === img
                      ? "border-brand-blue ring-2 ring-brand-blue/20"
                      : "border-slate-200 hover:border-slate-400"
                  }`}
                >
                  <img
                    src={img}
                    alt=""
                    className="h-full w-full object-cover object-center"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Product Details */}
        <div className="flex flex-col space-y-6">
          <div>
            {product.category && (
              <span className="text-xs font-bold tracking-widest text-brand-blue uppercase">
                {product.category.name}
              </span>
            )}
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-brand-charcoal sm:text-3xl">
              {product.name}
            </h1>

            {/* Ratings Bar */}
            <div className="mt-3 flex items-center gap-2">
              <div className="flex items-center text-amber-500">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span className="ml-1 text-sm font-bold text-slate-800">
                  {product.rating > 0 ? product.rating.toFixed(1) : "New"}
                </span>
              </div>
              <span className="text-slate-300">•</span>
              <a
                href="#reviews"
                className="text-xs font-medium text-slate-500 hover:text-brand-blue hover:underline"
              >
                {product.reviewCount} customer{" "}
                {product.reviewCount === 1 ? "review" : "reviews"}
              </a>
            </div>
          </div>

          {/* Pricing Row */}
          <div className="flex items-baseline gap-3 border-y border-slate-100 py-4">
            <span className="text-3xl font-black text-brand-charcoal">
              ₹{currentPrice.toLocaleString("en-IN")}
            </span>
            {hasDiscount && (
              <span className="text-base text-slate-400 line-through">
                ₹{product.price.toLocaleString("en-IN")}
              </span>
            )}
            <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
              Tax Included
            </span>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Description
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-600 sm:text-sm">
              {product.description}
            </p>
          </div>

          {/* Stock Guard Status */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700">
              Availability:
            </span>
            {isOutOfStock ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-700">
                <XCircle className="h-3.5 w-3.5" />
                Out of Stock
              </span>
            ) : product.stock <= 5 ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700">
                <AlertCircle className="h-3.5 w-3.5" />
                Only {product.stock} units left in stock
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                <CheckCircle className="h-3.5 w-3.5" />
                In Stock ({product.stock} available)
              </span>
            )}
          </div>

          {/* Quantity Selector & Add to Cart */}
          {!isOutOfStock && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-4">
                <div className="flex items-center rounded-lg border border-slate-300 bg-white">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-12 text-center text-sm font-bold text-brand-charcoal">
                    {quantity}
                  </span>
                  <button
                    onClick={() =>
                      setQuantity(Math.min(product.stock, quantity + 1))
                    }
                    disabled={quantity >= product.stock}
                    className="p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                    aria-label="Increase quantity"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={addToCartMutation.isPending}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-blue py-3 px-6 text-sm font-bold text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-600 focus:ring-2 focus:ring-brand-blue focus:ring-offset-2 disabled:opacity-60"
                >
                  {addToCartMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ShoppingCart className="h-4 w-4" />
                  )}
                  <span>
                    {addToCartMutation.isPending
                      ? "Adding to Cart..."
                      : "Add to Cart"}
                  </span>
                </button>
              </div>

              {cartSuccess && (
                <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">
                  <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>Item added to your cart successfully!</span>
                  <Link
                    href="/cart"
                    className="ml-auto underline font-bold hover:text-emerald-950"
                  >
                    View Cart
                  </Link>
                </div>
              )}

              {cartError && (
                <div className="flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-xs text-rose-700">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{cartError}</span>
                </div>
              )}
            </div>
          )}

          {/* Guarantee Badges */}
          <div className="grid grid-cols-3 gap-3 border-t border-slate-200 pt-6">
            <div className="flex flex-col items-center text-center p-3 rounded-xl bg-slate-50">
              <Truck className="h-5 w-5 text-brand-blue mb-1" />
              <span className="text-[11px] font-bold text-brand-charcoal">
                Cash On Delivery
              </span>
              <span className="text-[10px] text-slate-400">
                Doorstep payment
              </span>
            </div>
            <div className="flex flex-col items-center text-center p-3 rounded-xl bg-slate-50">
              <ShieldCheck className="h-5 w-5 text-cyan-accent mb-1" />
              <span className="text-[11px] font-bold text-brand-charcoal">
                Verified Quality
              </span>
              <span className="text-[10px] text-slate-400">
                Authentic guarantee
              </span>
            </div>
            <div className="flex flex-col items-center text-center p-3 rounded-xl bg-slate-50">
              <RotateCcw className="h-5 w-5 text-indigo-600 mb-1" />
              <span className="text-[11px] font-bold text-brand-charcoal">
                Live Stock
              </span>
              <span className="text-[10px] text-slate-400">
                Zero overselling
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews & Feedback Section */}
      <section id="reviews" className="mt-20 border-t border-slate-200 pt-12">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-brand-blue" />
            <h2 className="text-xl font-bold tracking-tight text-brand-charcoal">
              Customer Reviews ({reviewsData?.count || 0})
            </h2>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-12 lg:grid-cols-3">
          {/* Write a Review Box */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs h-fit">
            <h3 className="text-sm font-bold text-brand-charcoal">
              Write a Review
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Share your genuine feedback with verified buyers.
            </p>

            {user ? (
              <form onSubmit={handleReviewSubmit} className="mt-4 space-y-4">
                {reviewError && (
                  <div className="rounded-lg bg-rose-50 p-2.5 text-xs text-rose-700">
                    {reviewError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Rating (1 to 5 Stars)
                  </label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setReviewRating(star)}
                        className="p-1 text-amber-400 hover:scale-110 transition"
                      >
                        <Star
                          className={`h-5 w-5 ${
                            star <= reviewRating
                              ? "fill-amber-400 text-amber-400"
                              : "text-slate-300"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Comment
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Describe product build quality, delivery speed..."
                    className="w-full rounded-lg border border-slate-300 p-2.5 text-xs outline-none focus:border-brand-blue"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitReviewMutation.isPending}
                  className="w-full rounded-lg bg-brand-blue py-2.5 text-xs font-bold text-white shadow-xs hover:bg-blue-600 disabled:opacity-60"
                >
                  {submitReviewMutation.isPending
                    ? "Submitting..."
                    : "Submit Review"}
                </button>
              </form>
            ) : (
              <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-4 text-center">
                <p className="text-xs text-slate-600">
                  Please log in to leave an authentic review for this product.
                </p>
                <Link
                  href="/login"
                  className="mt-3 inline-block rounded-lg bg-brand-blue px-4 py-1.5 text-xs font-semibold text-white"
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>

          {/* Reviews List */}
          <div className="lg:col-span-2 space-y-4">
            {isReviewsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-brand-blue" />
              </div>
            ) : reviewsData && reviewsData.reviews.length > 0 ? (
              reviewsData.reviews.map((rev) => (
                <article
                  key={rev._id}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white uppercase">
                        {rev.user?.name ? rev.user.name.charAt(0) : "U"}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-brand-charcoal">
                          {rev.user?.name || "Customer"}
                        </h4>
                        <span className="text-[10px] text-slate-400">
                          {new Date(rev.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-amber-500">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3.5 w-3.5 ${
                            i < rev.rating
                              ? "fill-amber-400 text-amber-400"
                              : "text-slate-200"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <p className="mt-3 text-xs leading-relaxed text-slate-600">
                    {rev.comment}
                  </p>
                </article>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center text-xs text-slate-400">
                No customer reviews yet. Be the first to review this product!
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
