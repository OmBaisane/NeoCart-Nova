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
  Edit2,
  Trash2,
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

  // Review Edit States
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

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
    onError: (err: {
      response?: { data?: { message?: string } };
      message?: string;
    }) => {
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
    onError: (err: {
      response?: { data?: { message?: string } };
      message?: string;
    }) => {
      setReviewError(
        err.response?.data?.message || err.message || "Failed to submit review",
      );
    },
  });

  // 5. Update Review Mutation (Author only)
  const updateReviewMutation = useMutation({
    mutationFn: async ({
      id,
      rating,
      comment,
    }: {
      id: string;
      rating: number;
      comment: string;
    }) => {
      return api.patch(`/reviews/${id}`, { rating, comment });
    },
    onSuccess: () => {
      setEditingReviewId(null);
      setActionError(null);
      queryClient.invalidateQueries({ queryKey: ["reviews", product?._id] });
      queryClient.invalidateQueries({ queryKey: ["product", slug] });
    },
    onError: (err: {
      response?: { data?: { message?: string } };
      message?: string;
    }) => {
      setActionError(
        err.response?.data?.message || err.message || "Failed to update review",
      );
    },
  });

  // 6. Delete Review Mutation (Author or Admin)
  const deleteReviewMutation = useMutation({
    mutationFn: async (reviewId: string) => {
      return api.delete(`/reviews/${reviewId}`);
    },
    onSuccess: () => {
      setActionError(null);
      queryClient.invalidateQueries({ queryKey: ["reviews", product?._id] });
      queryClient.invalidateQueries({ queryKey: ["product", slug] });
    },
    onError: (err: {
      response?: { data?: { message?: string } };
      message?: string;
    }) => {
      setActionError(
        err.response?.data?.message || err.message || "Failed to delete review",
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

  const handleStartEdit = (rev: ReviewItem) => {
    setEditingReviewId(rev._id);
    setEditRating(rev.rating);
    setEditComment(rev.comment);
    setActionError(null);
  };

  const handleSaveEdit = (e: React.FormEvent, id: string) => {
    e.preventDefault();
    if (editComment.trim().length < 3) {
      setActionError("Comment must be at least 3 characters long.");
      return;
    }
    updateReviewMutation.mutate({
      id,
      rating: editRating,
      comment: editComment.trim(),
    });
  };

  const handleDeleteReview = (id: string) => {
    if (window.confirm("Are you sure you want to delete this review?")) {
      deleteReviewMutation.mutate(id);
    }
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
    <main className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-5 sm:py-8">
      {/* Breadcrumb Navigation */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-medium text-slate-500 mb-5 sm:mb-8 overflow-x-auto whitespace-nowrap pb-1"
      >
        <Link href="/" className="hover:text-brand-blue shrink-0">
          Home
        </Link>
        <ChevronRight className="h-3 w-3 text-slate-400 shrink-0" />
        <Link href="/products" className="hover:text-brand-blue shrink-0">
          Products
        </Link>
        <ChevronRight className="h-3 w-3 text-slate-400 shrink-0" />
        <span className="text-brand-charcoal truncate max-w-48 sm:max-w-xs">
          {product.name}
        </span>
      </nav>

      {/* Main Product Layout */}
      <section className="grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-2 lg:gap-12">
        {/* Left: Product Images */}
        <div className="space-y-3 sm:space-y-4">
          <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <img
              src={activeImage}
              alt={product.name}
              className="h-full w-full object-cover object-center"
            />
            {hasDiscount && (
              <span className="absolute top-3 left-3 sm:top-4 sm:left-4 rounded-full bg-rose-600 px-2.5 py-0.5 sm:px-3 sm:py-1 text-[11px] sm:text-xs font-bold text-white shadow-sm">
                SAVE ₹{product.price - product.discountPrice!}
              </span>
            )}
          </div>

          {/* Thumbnails */}
          {product.images && product.images.length > 1 && (
            <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img)}
                  className={`relative aspect-square h-16 w-16 sm:h-20 sm:w-20 shrink-0 overflow-hidden rounded-xl border-2 transition ${
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

        {/* Right: Details */}
        <div className="flex flex-col space-y-4 sm:space-y-6">
          <div>
            {product.category && (
              <span className="text-[11px] sm:text-xs font-bold tracking-widest text-brand-blue uppercase">
                {product.category.name}
              </span>
            )}
            <h1 className="mt-1 sm:mt-2 text-xl sm:text-3xl font-extrabold tracking-tight text-brand-charcoal">
              {product.name}
            </h1>

            {/* Ratings Bar */}
            <div className="mt-2.5 flex items-center gap-2">
              <div className="flex items-center text-amber-500">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span className="ml-1 text-xs sm:text-sm font-bold text-slate-800">
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
          <div className="flex items-baseline gap-2.5 sm:gap-3 border-y border-slate-100 py-3 sm:py-4">
            <span className="text-2xl sm:text-3xl font-black text-brand-charcoal">
              ₹{currentPrice.toLocaleString("en-IN")}
            </span>
            {hasDiscount && (
              <span className="text-sm sm:text-base text-slate-400 line-through">
                ₹{product.price.toLocaleString("en-IN")}
              </span>
            )}
            <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] sm:text-xs font-semibold text-emerald-700">
              Tax Included
            </span>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Description
            </h3>
            <p className="mt-1.5 sm:mt-2 text-xs leading-relaxed text-slate-600 sm:text-sm">
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
                Only {product.stock} units left
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
            <div className="space-y-3 pt-1">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="flex items-center rounded-lg border border-slate-300 bg-white">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-10 sm:w-12 text-center text-xs sm:text-sm font-bold text-brand-charcoal">
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
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-blue py-2.5 sm:py-3 px-4 sm:px-6 text-xs sm:text-sm font-bold text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-600 focus:ring-2 focus:ring-brand-blue focus:ring-offset-2 disabled:opacity-60"
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
                <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-2.5 sm:p-3 text-xs font-semibold text-emerald-800">
                  <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>Item added to cart!</span>
                  <Link
                    href="/cart"
                    className="ml-auto underline font-bold hover:text-emerald-950"
                  >
                    View Cart
                  </Link>
                </div>
              )}

              {cartError && (
                <div className="flex items-center gap-2 rounded-lg bg-rose-50 p-2.5 sm:p-3 text-xs text-rose-700">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{cartError}</span>
                </div>
              )}
            </div>
          )}

          {/* Guarantee Badges */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 border-t border-slate-200 pt-4 sm:pt-6">
            <div className="flex flex-col items-center text-center p-2.5 sm:p-3 rounded-xl bg-slate-50">
              <Truck className="h-4 w-4 sm:h-5 sm:w-5 text-brand-blue mb-1" />
              <span className="text-[10px] sm:text-[11px] font-bold text-brand-charcoal">
                COD Available
              </span>
              <span className="text-[9px] sm:text-[10px] text-slate-400">
                Doorstep pay
              </span>
            </div>
            <div className="flex flex-col items-center text-center p-2.5 sm:p-3 rounded-xl bg-slate-50">
              <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-accent mb-1" />
              <span className="text-[10px] sm:text-[11px] font-bold text-brand-charcoal">
                Verified Quality
              </span>
              <span className="text-[9px] sm:text-[10px] text-slate-400">
                Authentic
              </span>
            </div>
            <div className="flex flex-col items-center text-center p-2.5 sm:p-3 rounded-xl bg-slate-50">
              <RotateCcw className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600 mb-1" />
              <span className="text-[10px] sm:text-[11px] font-bold text-brand-charcoal">
                Live Stock
              </span>
              <span className="text-[9px] sm:text-[10px] text-slate-400">
                Zero oversell
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews & Feedback Section */}
      <section
        id="reviews"
        className="mt-12 sm:mt-16 border-t border-slate-200 pt-8 sm:pt-12"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 sm:pb-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-brand-blue shrink-0" />
            <h2 className="text-base sm:text-xl font-bold tracking-tight text-brand-charcoal">
              Customer Reviews ({reviewsData?.count || 0})
            </h2>
          </div>
        </div>

        {actionError && (
          <div className="mt-3 rounded-lg bg-rose-50 p-2.5 text-xs text-rose-700">
            {actionError}
          </div>
        )}

        <div className="mt-6 sm:mt-8 grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-3 lg:gap-12">
          {/* Write Review Box */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-xs h-fit">
            <h3 className="text-xs sm:text-sm font-bold text-brand-charcoal">
              Write a Review
            </h3>
            <p className="mt-0.5 sm:mt-1 text-[11px] sm:text-xs text-slate-500">
              Share your genuine feedback with verified buyers.
            </p>

            {user ? (
              <form
                onSubmit={handleReviewSubmit}
                className="mt-3 sm:mt-4 space-y-3.5 sm:space-y-4"
              >
                {reviewError && (
                  <div className="rounded-lg bg-rose-50 p-2 text-xs text-rose-700">
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
                          className={`h-4 w-4 sm:h-5 sm:w-5 ${
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
                    rows={3}
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
                  className="w-full rounded-lg bg-brand-blue py-2 sm:py-2.5 text-xs font-bold text-white shadow-xs hover:bg-blue-600 disabled:opacity-60"
                >
                  {submitReviewMutation.isPending
                    ? "Submitting..."
                    : "Submit Review"}
                </button>
              </form>
            ) : (
              <div className="mt-3 sm:mt-4 rounded-xl border border-slate-100 bg-slate-50 p-3 sm:p-4 text-center">
                <p className="text-xs text-slate-600">
                  Please log in to leave an authentic review for this product.
                </p>
                <Link
                  href="/login"
                  className="mt-2.5 sm:mt-3 inline-block rounded-lg bg-brand-blue px-3.5 py-1.5 text-xs font-semibold text-white"
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>

          {/* Reviews List */}
          <div className="lg:col-span-2 space-y-3 sm:space-y-4">
            {isReviewsLoading ? (
              <div className="flex justify-center py-8 sm:py-12">
                <Loader2 className="h-6 w-6 animate-spin text-brand-blue" />
              </div>
            ) : reviewsData && reviewsData.reviews.length > 0 ? (
              reviewsData.reviews.map((rev) => {
                const authUser = user as
                  | (typeof user & { _id?: string; id?: string })
                  | null;
                const currentUserId = authUser?._id || authUser?.id;
                const isAuthor = Boolean(
                  currentUserId &&
                  rev.user?._id &&
                  currentUserId === rev.user._id,
                );
                const isAdmin = user?.role === "admin";
                const isEditing = editingReviewId === rev._id;
                return (
                  <article
                    key={rev._id}
                    className="rounded-xl border border-slate-200 bg-white p-3.5 sm:p-5 shadow-2xs"
                  >
                    {isEditing ? (
                      <form
                        onSubmit={(e) => handleSaveEdit(e, rev._id)}
                        className="space-y-2.5 sm:space-y-3"
                      >
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              type="button"
                              key={star}
                              onClick={() => setEditRating(star)}
                              className="p-1 text-amber-400"
                            >
                              <Star
                                className={`h-4 w-4 ${
                                  star <= editRating
                                    ? "fill-amber-400 text-amber-400"
                                    : "text-slate-300"
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                        <textarea
                          rows={3}
                          required
                          value={editComment}
                          onChange={(e) => setEditComment(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 p-2 text-xs outline-none focus:border-brand-blue"
                        />
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            disabled={updateReviewMutation.isPending}
                            className="rounded-md bg-brand-blue px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-600 disabled:opacity-50"
                          >
                            {updateReviewMutation.isPending
                              ? "Saving..."
                              : "Save"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingReviewId(null)}
                            className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                            <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white uppercase">
                              {rev.user?.name ? rev.user.name.charAt(0) : "U"}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-brand-charcoal truncate">
                                {rev.user?.name || "Customer"}
                              </h4>
                              <span className="text-[10px] text-slate-400">
                                {new Date(rev.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                            <div className="flex items-center gap-0.5 sm:gap-1 text-amber-500">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-3 w-3 sm:h-3.5 sm:w-3.5 ${
                                    i < rev.rating
                                      ? "fill-amber-400 text-amber-400"
                                      : "text-slate-200"
                                  }`}
                                />
                              ))}
                            </div>

                            <div className="flex items-center gap-1 border-l border-slate-100 pl-1.5 sm:pl-2">
                              {isAuthor && (
                                <button
                                  type="button"
                                  onClick={() => handleStartEdit(rev)}
                                  className="p-1 text-slate-400 hover:text-brand-blue"
                                  title="Edit your review"
                                >
                                  <Edit2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                </button>
                              )}
                              {(isAuthor || isAdmin) && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteReview(rev._id)}
                                  className="p-1 text-slate-400 hover:text-rose-600"
                                  title="Delete review"
                                >
                                  <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        <p className="mt-2.5 sm:mt-3 text-xs leading-relaxed text-slate-600">
                          {rev.comment}
                        </p>
                      </>
                    )}
                  </article>
                );
              })
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 sm:p-12 text-center text-xs text-slate-400">
                No customer reviews yet. Be the first to review this product!
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
