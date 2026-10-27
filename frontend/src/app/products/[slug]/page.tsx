"use client";

import React, { useState, use, useEffect } from "react";
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
  Scale,
  RotateCcw,
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

  // Compare Logic State
  const [isComparing, setIsComparing] = useState(false);
  const [compareMessage, setCompareMessage] = useState<{
    text: string;
    error: boolean;
  } | null>(null);

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

  // 2. Add to Recently Viewed (Milestone 4 Logic)
  useEffect(() => {
    if (product?._id) {
      try {
        const stored = localStorage.getItem("neocart_recent_viewed");
        let recent = stored ? JSON.parse(stored) : [];
        recent = recent.filter((id: string) => id !== product._id);
        recent.unshift(product._id);
        if (recent.length > 8) recent = recent.slice(0, 8);
        localStorage.setItem("neocart_recent_viewed", JSON.stringify(recent));
      } catch {
        // Silently ignore local storage errors
      }
    }
  }, [product?._id]);

  // Handle Compare Logic (Milestone 5 Logic)
  const handleCompareToggle = () => {
    if (!product) return;
    try {
      const stored = localStorage.getItem("neocart_compare_list");
      const compareList: string[] = stored ? JSON.parse(stored) : [];

      if (compareList.includes(product._id)) {
        router.push("/compare");
        return;
      }

      if (compareList.length >= 3) {
        setCompareMessage({
          text: "Comparison limit reached (max 3 products).",
          error: true,
        });
        setTimeout(() => setCompareMessage(null), 3000);
        return;
      }

      // Check Category mismatch rule
      if (compareList.length > 0) {
        api
          .get(`/products/${compareList[0]}`)
          .then((res) => {
            const firstCategory = res.data?.product?.category?._id;
            if (
              firstCategory &&
              product.category &&
              firstCategory !== (product.category as { _id?: string })._id
            ) {
              setCompareMessage({
                text: "You can only compare products from the same category.",
                error: true,
              });
              setTimeout(() => setCompareMessage(null), 3000);
            } else {
              compareList.push(product._id);
              localStorage.setItem(
                "neocart_compare_list",
                JSON.stringify(compareList),
              );
              setIsComparing(true);
              router.push("/compare");
            }
          })
          .catch(() => {
            compareList.push(product._id);
            localStorage.setItem(
              "neocart_compare_list",
              JSON.stringify(compareList),
            );
            setIsComparing(true);
            router.push("/compare");
          });
      } else {
        compareList.push(product._id);
        localStorage.setItem(
          "neocart_compare_list",
          JSON.stringify(compareList),
        );
        setIsComparing(true);
        router.push("/compare");
      }
    } catch {
      // Ignore parse error
    }
  };

  // Check initial compare state
  useEffect(() => {
    if (product?._id) {
      try {
        const stored = localStorage.getItem("neocart_compare_list");
        if (stored && JSON.parse(stored).includes(product._id)) {
          setIsComparing(true);
        }
      } catch {}
    }
  }, [product?._id]);

  // Fetch Product Reviews
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

  // Add to Cart Mutation
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
        err.response?.data?.message || err.message || "Failed to add to cart.",
      );
    },
  });

  // Submit Review Mutation
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

  // Update Review Mutation (Author only)
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

  // Delete Review Mutation (Author or Admin)
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
      setReviewError("Comment must be at least 3 characters.");
      return;
    }
    submitReviewMutation.mutate();
  };

  const handleUpdateSubmit = (e: React.FormEvent, reviewId: string) => {
    e.preventDefault();
    if (editComment.trim().length < 3) {
      setActionError("Comment must be at least 3 characters.");
      return;
    }
    updateReviewMutation.mutate({
      id: reviewId,
      rating: editRating,
      comment: editComment,
    });
  };

  const handleDeleteReview = (reviewId: string) => {
    if (confirm("Are you sure you want to delete this review?")) {
      deleteReviewMutation.mutate(reviewId);
    }
  };

  if (isProductLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-blue dark:text-cyan-400" />
      </div>
    );
  }

  if (productError || !product) {
    return (
      <div className="mx-auto max-w-lg py-20 text-center">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Product Not Found
        </h2>
        <p className="mt-2 text-slate-500 dark:text-slate-400">
          The item you are looking for might have been removed or deactivated.
        </p>
        <Link
          href="/products"
          className="mt-6 inline-block rounded-xl bg-brand-blue px-6 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500"
        >
          Return to Catalog
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

  const userReview = reviewsData?.reviews.find((r) => r.user._id === user?.id);

  return (
    <main className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-12">
      {/* 1. Breadcrumbs */}
      <nav className="flex items-center gap-2 text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider dark:text-slate-500 overflow-x-auto whitespace-nowrap pb-2">
        <Link
          href="/"
          className="hover:text-brand-blue dark:hover:text-cyan-400 transition"
        >
          Home
        </Link>
        <ChevronRight className="h-3 w-3 shrink-0" />
        <Link
          href="/products"
          className="hover:text-brand-blue dark:hover:text-cyan-400 transition"
        >
          Catalog
        </Link>
        <ChevronRight className="h-3 w-3 shrink-0" />
        {product.category && (
          <>
            <Link
              href={`/products?category=${product.category.slug}`}
              className="hover:text-brand-blue dark:hover:text-cyan-400 transition"
            >
              {product.category.name}
            </Link>
            <ChevronRight className="h-3 w-3 shrink-0" />
          </>
        )}
        <span className="text-slate-700 dark:text-slate-300 font-bold truncate">
          {product.name}
        </span>
      </nav>

      {/* 2. Product Information Split */}
      <section className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
        {/* Left: Gallery */}
        <div className="space-y-4">
          <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800">
            <img
              src={selectedImage || product.images[0]}
              alt={product.name}
              className="h-full w-full object-cover object-center"
            />
            {hasDiscount && (
              <span className="absolute left-4 top-4 rounded-full bg-rose-600 px-3 py-1 text-xs font-bold text-white shadow-sm">
                SAVE ₹{product.price - product.discountPrice!}
              </span>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="grid grid-cols-5 gap-3">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img)}
                  className={`relative aspect-square overflow-hidden rounded-xl bg-slate-100 transition dark:bg-slate-800 ${
                    (selectedImage || product.images[0]) === img
                      ? "ring-2 ring-brand-blue ring-offset-2 dark:ring-cyan-500 dark:ring-offset-slate-950"
                      : "opacity-70 hover:opacity-100"
                  }`}
                >
                  <img
                    src={img}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Info & Actions */}
        <div className="flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
              {product.name}
            </h1>

            {/* Ratings Bar */}
            <div className="mt-2.5 flex items-center gap-2">
              <div className="flex items-center text-amber-500">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span className="ml-1 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                  {product.rating > 0 ? product.rating.toFixed(1) : "New"}
                </span>
              </div>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <a
                href="#reviews"
                className="text-xs font-medium text-slate-500 hover:text-brand-blue hover:underline dark:text-slate-400 dark:hover:text-cyan-400"
              >
                {product.reviewCount} customer{" "}
                {product.reviewCount === 1 ? "review" : "reviews"}
              </a>
            </div>
          </div>

          {/* Pricing Row */}
          <div className="flex items-baseline gap-2.5 sm:gap-3 border-y border-slate-100 dark:border-slate-800 py-3 sm:py-4">
            <span className="text-2xl sm:text-3xl font-black text-brand-charcoal dark:text-white">
              ₹{currentPrice.toLocaleString("en-IN")}
            </span>
            {hasDiscount && (
              <span className="text-sm sm:text-base text-slate-400 line-through dark:text-slate-500">
                ₹{product.price.toLocaleString("en-IN")}
              </span>
            )}
            <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] sm:text-xs font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
              Tax Included
            </span>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider dark:text-slate-300">
              Description
            </h3>
            <p className="mt-1.5 sm:mt-2 text-xs leading-relaxed text-slate-600 sm:text-sm dark:text-slate-400">
              {product.description}
            </p>
          </div>

          {/* Stock Guard Status */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Availability:
            </span>
            {isOutOfStock ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-700 dark:bg-rose-950/60 dark:text-rose-400">
                <XCircle className="h-3.5 w-3.5" />
                Out of Stock
              </span>
            ) : product.stock <= 5 ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
                <AlertCircle className="h-3.5 w-3.5" />
                Only {product.stock} units left
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                <CheckCircle className="h-3.5 w-3.5" />
                In Stock ({product.stock} available)
              </span>
            )}
          </div>

          {/* Quantity Selector, Add to Cart & Compare */}
          {!isOutOfStock && (
            <div className="space-y-3 pt-1">
              <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                <div className="flex items-center rounded-lg border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-800">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-10 text-center text-sm font-bold text-slate-900 dark:text-white">
                    {quantity}
                  </span>
                  <button
                    onClick={() =>
                      setQuantity(Math.min(product.stock, quantity + 1))
                    }
                    disabled={quantity >= product.stock}
                    className="p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={addToCartMutation.isPending}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-blue px-6 py-3.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition hover:bg-blue-600 disabled:opacity-60 dark:bg-blue-600 dark:hover:bg-blue-500"
                >
                  {addToCartMutation.isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <ShoppingCart className="h-5 w-5" />
                      <span>
                        Add to Cart — ₹
                        {(currentPrice * quantity).toLocaleString("en-IN")}
                      </span>
                    </>
                  )}
                </button>

                {/* Compare Button (Milestone 5) */}
                <button
                  onClick={handleCompareToggle}
                  className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-xs sm:text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  <Scale className="h-5 w-5" />
                  <span className="hidden sm:inline">
                    {isComparing ? "View Comparison" : "Compare"}
                  </span>
                </button>
              </div>

              {/* Compare Error / Feedback Message */}
              {compareMessage && (
                <div
                  className={`text-xs font-semibold ${compareMessage.error ? "text-rose-500" : "text-emerald-500"}`}
                >
                  {compareMessage.text}
                </div>
              )}

              {/* Cart UI Feedback */}
              {cartSuccess && (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                  <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>Item reserved and added to your bag.</span>
                </div>
              )}
              {cartError && (
                <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{cartError}</span>
                </div>
              )}
            </div>
          )}

          {/* Delivery & Security Promises */}
          <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-3 dark:border-slate-800 dark:bg-slate-900/60 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-3">
              <Truck className="h-5 w-5 text-brand-blue dark:text-cyan-400 shrink-0" />
              <span>Doorstep Cash on Delivery Available</span>
            </div>
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-emerald-500 dark:text-emerald-400 shrink-0" />
              <span>Verified Warehouse Inventory</span>
            </div>
            <div className="flex items-center gap-3">
              <RotateCcw className="h-5 w-5 text-slate-400 shrink-0" />
              <span>Eligible for Return if Seal is Intact</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Customer Reviews Section */}
      <section
        id="reviews"
        className="border-t border-slate-200 pt-8 sm:pt-12 dark:border-slate-800"
      >
        <div className="flex items-center gap-3">
          <MessageSquare className="h-6 w-6 text-brand-blue dark:text-cyan-400" />
          <h2 className="text-xl sm:text-2xl font-black text-brand-charcoal dark:text-white">
            Verified Customer Reviews
          </h2>
        </div>
        <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          We strictly enforce a one-review-per-customer rule.
        </p>

        {actionError && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-1 h-fit">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white border-b border-slate-100 pb-3 mb-4 dark:border-slate-800">
                Write a Review
              </h3>

              {!user ? (
                <div className="text-center py-4">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                    Sign in to share your experience.
                  </p>
                  <Link
                    href={`/login?redirect=/products/${slug}`}
                    className="inline-block rounded-lg bg-brand-blue px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500"
                  >
                    Sign In to Review
                  </Link>
                </div>
              ) : userReview && !editingReviewId ? (
                <div className="rounded-xl bg-slate-50 p-4 text-center dark:bg-slate-800/60">
                  <CheckCircle className="mx-auto h-8 w-8 text-emerald-500 mb-2 dark:text-emerald-400" />
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    You have already reviewed this product.
                  </p>
                  <button
                    onClick={() => {
                      setEditingReviewId(userReview._id);
                      setEditRating(userReview.rating);
                      setEditComment(userReview.comment);
                    }}
                    className="mt-3 text-[11px] font-bold text-brand-blue hover:underline dark:text-cyan-400"
                  >
                    Edit your review
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={(e) =>
                    editingReviewId
                      ? handleUpdateSubmit(e, editingReviewId)
                      : handleReviewSubmit(e)
                  }
                  className="space-y-4"
                >
                  {reviewError && !editingReviewId && (
                    <div className="rounded-lg bg-rose-50 p-2.5 text-[11px] text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                      {reviewError}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Rating (1-5) *
                    </label>
                    <select
                      value={editingReviewId ? editRating : reviewRating}
                      onChange={(e) =>
                        editingReviewId
                          ? setEditRating(Number(e.target.value))
                          : setReviewRating(Number(e.target.value))
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs outline-none focus:border-brand-blue dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-cyan-500"
                    >
                      <option value="5">5 - Excellent</option>
                      <option value="4">4 - Very Good</option>
                      <option value="3">3 - Average</option>
                      <option value="2">2 - Poor</option>
                      <option value="1">1 - Terrible</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Your Comment *
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={editingReviewId ? editComment : reviewComment}
                      onChange={(e) =>
                        editingReviewId
                          ? setEditComment(e.target.value)
                          : setReviewComment(e.target.value)
                      }
                      placeholder="Share details of your experience..."
                      className="w-full rounded-lg border border-slate-300 p-3 text-xs outline-none focus:border-brand-blue dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 dark:focus:border-cyan-500"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    {editingReviewId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingReviewId(null);
                          setEditRating(5);
                          setEditComment("");
                        }}
                        className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={
                        submitReviewMutation.isPending ||
                        updateReviewMutation.isPending
                      }
                      className="flex-1 rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white transition hover:bg-brand-blue disabled:opacity-60 dark:bg-slate-800 dark:hover:bg-cyan-600"
                    >
                      {submitReviewMutation.isPending ||
                      updateReviewMutation.isPending ? (
                        <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                      ) : editingReviewId ? (
                        "Update Review"
                      ) : (
                        "Submit Review"
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          <div className="lg:col-span-2">
            {isReviewsLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
              </div>
            ) : !reviewsData?.reviews || reviewsData.reviews.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                  There are no reviews for this product yet.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviewsData.reviews.map((rev) => (
                  <article
                    key={rev._id}
                    className={`rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900 ${
                      editingReviewId === rev._id
                        ? "opacity-50 pointer-events-none"
                        : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3 mb-3 dark:border-slate-800">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-brand-blue font-bold uppercase dark:bg-blue-950/60 dark:text-cyan-400">
                          {rev.user?.name ? rev.user.name.charAt(0) : "A"}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">
                            {rev.user?.name || "Anonymous User"}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <div className="flex text-amber-500">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-3 w-3 ${i < rev.rating ? "fill-amber-400 text-amber-400" : "text-slate-200 dark:text-slate-700"}`}
                                />
                              ))}
                            </div>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500">
                              {new Date(rev.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {(user?.id === rev.user?._id ||
                        user?.role === "admin") && (
                        <div className="flex gap-2">
                          {user?.id === rev.user?._id && (
                            <button
                              onClick={() => {
                                setEditingReviewId(rev._id);
                                setEditRating(rev.rating);
                                setEditComment(rev.comment);
                              }}
                              className="text-slate-400 hover:text-brand-blue transition dark:hover:text-cyan-400"
                              title="Edit Review"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteReview(rev._id)}
                            disabled={deleteReviewMutation.isPending}
                            className="text-slate-400 hover:text-rose-500 transition dark:hover:text-rose-400"
                            title="Delete Review"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                    <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                      {rev.comment}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
