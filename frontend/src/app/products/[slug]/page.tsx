"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, Loader2, AlertCircle, ArrowLeft } from "lucide-react";

import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import type { ProductItem } from "@/components/ui/ProductCard";

import ProductGallery from "@/components/products/ProductGallery";
import ProductInfo from "@/components/products/ProductInfo";
import ProductActions from "@/components/products/ProductActions";
import ProductReviews from "@/components/products/ProductReviews";
import type { ReviewItem } from "@/components/products/ReviewCard";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

interface CompareMessage {
  text: string;
  error: boolean;
}

function getErrorMessage(error: unknown, fallback: string): string {
  const apiError = error as {
    response?: { data?: { message?: string } };
    message?: string;
  };

  return apiError.response?.data?.message || apiError.message || fallback;
}

export default function ProductDetailsPage({ params }: ProductPageProps) {
  const { slug } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  const [compareMessage, setCompareMessage] = useState<CompareMessage | null>(
    null,
  );

  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitError, setReviewSubmitError] = useState<string | null>(
    null,
  );

  // Product details
  const {
    data: product,
    isLoading: isProductLoading,
    isError: isProductError,
    refetch: refetchProduct,
  } = useQuery<ProductItem>({
    queryKey: ["product", slug],
    queryFn: async () => {
      const res = await api.get(`/products/${slug}`);
      return res.data?.product;
    },
    enabled: Boolean(slug),
  });

  // Wishlist
  const { data: wishlistData, isLoading: isWishlistLoading } = useQuery<{
    success: boolean;
    count: number;
    products: ProductItem[];
  }>({
    queryKey: ["wishlist"],
    queryFn: async () => {
      const res = await api.get("/wishlist");
      return res.data;
    },
    enabled: Boolean(user),
    staleTime: 1000 * 60,
  });

  const wishlistProducts = wishlistData?.products ?? [];

  const isInWishlist = Boolean(
    product && wishlistProducts.some((item) => item._id === product._id),
  );

  const wishlistMutation = useMutation({
    mutationFn: async () => {
      if (!product) {
        throw new Error("Product not found.");
      }

      if (isInWishlist) {
        return api.delete(`/wishlist/${product._id}`);
      }

      return api.post("/wishlist", {
        productId: product._id,
      });
    },

    onSuccess: (response) => {
      queryClient.setQueryData(["wishlist"], response.data);

      queryClient.invalidateQueries({
        queryKey: ["wishlist"],
      });
    },
  });

  const handleWishlistToggle = () => {
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(`/products/${slug}`)}`);
      return;
    }

    if (!wishlistMutation.isPending) {
      wishlistMutation.mutate();
    }
  };

  // Cart
  const cartMutation = useMutation({
    mutationFn: async () => {
      if (!product) throw new Error("Product not found.");

      return api.post("/cart/items", {
        productId: product._id,
        quantity,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });

  const handleAddToCart = () => {
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(`/products/${slug}`)}`);
      return;
    }

    if (!product || product.stock <= 0) return;

    cartMutation.mutate();
  };

  // Recently viewed products
  useEffect(() => {
    if (!product?._id || typeof window === "undefined") return;

    try {
      const storageKey = "neocart_recent_viewed";
      const parsed: unknown = JSON.parse(
        localStorage.getItem(storageKey) || "[]",
      );

      const existing = Array.isArray(parsed)
        ? parsed.filter(
            (id): id is string => typeof id === "string" && id.length > 0,
          )
        : [];

      const updated = [
        product._id,
        ...existing.filter((id) => id !== product._id),
      ].slice(0, 8);

      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch {
      // Ignore unavailable or invalid local storage data.
    }
  }, [product?._id]);

  // Product comparison
  const handleCompare = () => {
    if (!product) return;

    try {
      const storageKey = "neocart_compare";
      const parsed: unknown = JSON.parse(
        localStorage.getItem(storageKey) || "[]",
      );

      const existing = Array.isArray(parsed)
        ? parsed.filter(
            (id): id is string => typeof id === "string" && id.length > 0,
          )
        : [];

      const uniqueIds = [...new Set(existing)].slice(0, 4);

      if (uniqueIds.includes(product._id)) {
        setCompareMessage({
          text: "This product is already in your comparison list.",
          error: true,
        });
        return;
      }

      if (uniqueIds.length >= 4) {
        setCompareMessage({
          text: "You can compare a maximum of 4 products. Remove one to add another.",
          error: true,
        });
        return;
      }

      const updated = [...uniqueIds, product._id];

      localStorage.setItem(storageKey, JSON.stringify(updated));

      setCompareMessage({
        text: "Product added to comparison list.",
        error: false,
      });
    } catch {
      setCompareMessage({
        text: "Unable to update comparison list.",
        error: true,
      });
    }
  };

  // Product reviews
  const {
    data: reviews = [],
    isLoading: isReviewsLoading,
    isError: isReviewsError,
    refetch: refetchReviews,
  } = useQuery<ReviewItem[]>({
    queryKey: ["reviews", product?._id],
    queryFn: async () => {
      if (!product) return [];

      const res = await api.get(`/products/${product._id}/reviews`);
      return res.data?.reviews ?? [];
    },
    enabled: Boolean(product?._id),
  });

  const reviewMutation = useMutation({
    mutationFn: async () => {
      if (!product) throw new Error("Product not found.");

      return api.post(`/products/${product._id}/reviews`, {
        rating: reviewRating,
        comment: reviewComment.trim(),
      });
    },
    onSuccess: () => {
      setReviewRating(5);
      setReviewComment("");
      setReviewSubmitError(null);

      queryClient.invalidateQueries({
        queryKey: ["reviews", product?._id],
      });
      queryClient.invalidateQueries({
        queryKey: ["product", slug],
      });
    },
    onError: (error: unknown) => {
      setReviewSubmitError(
        getErrorMessage(error, "Unable to submit your review."),
      );
    },
  });

  const handleReviewSubmit = () => {
    setReviewSubmitError(null);

    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(`/products/${slug}`)}`);
      return;
    }

    if (reviewRating < 1 || reviewRating > 5) {
      setReviewSubmitError("Please select a rating.");
      return;
    }

    if (!reviewComment.trim()) {
      setReviewSubmitError("Please write your review.");
      return;
    }

    reviewMutation.mutate();
  };

  // Update review
  const updateReviewMutation = useMutation({
    mutationFn: async ({
      reviewId,
      rating,
      comment,
    }: {
      reviewId: string;
      rating: number;
      comment: string;
    }) => {
      return api.patch(`/reviews/${reviewId}`, {
        rating,
        comment,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["reviews", product?._id],
      });
      queryClient.invalidateQueries({
        queryKey: ["product", slug],
      });
    },
  });

  const handleUpdateReview = (
    reviewId: string,
    rating: number,
    comment: string,
  ) => {
    updateReviewMutation.mutate({
      reviewId,
      rating,
      comment,
    });
  };

  // Delete review
  const deleteReviewMutation = useMutation({
    mutationFn: async (reviewId: string) => {
      return api.delete(`/reviews/${reviewId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["reviews", product?._id],
      });
      queryClient.invalidateQueries({
        queryKey: ["product", slug],
      });
    },
  });

  const handleDeleteReview = (reviewId: string) => {
    if (!window.confirm("Are you sure you want to delete this review?")) {
      return;
    }

    deleteReviewMutation.mutate(reviewId);
  };

  // Loading state
  if (isProductLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          Loading product...
        </div>
      </div>
    );
  }

  // Error state
  if (isProductError || !product) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h1 className="mt-4 text-2xl font-bold">Product Not Found</h1>
        <p className="mt-2 text-muted-foreground">
          This product may have been removed or is currently unavailable.
        </p>

        <button
          type="button"
          onClick={() => refetchProduct()}
          className="mt-5 rounded-lg border border-border px-5 py-3 font-medium transition hover:bg-muted"
        >
          Try Again
        </button>

        <Link
          href="/products"
          className="mt-3 inline-flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Products
        </Link>
      </div>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumbs */}
      <nav
        aria-label="Breadcrumb"
        className="mb-8 flex flex-wrap items-center gap-2 text-sm text-muted-foreground"
      >
        <Link href="/" className="transition hover:text-primary">
          Home
        </Link>

        <ChevronRight className="h-4 w-4" />

        <Link href="/products" className="transition hover:text-primary">
          Products
        </Link>

        {product.category?.name && (
          <>
            <ChevronRight className="h-4 w-4" />
            <span>{product.category.name}</span>
          </>
        )}

        <ChevronRight className="h-4 w-4" />
        <span className="max-w-45 truncate text-foreground">
          {product.name}
        </span>
      </nav>

      {/* Product details */}
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-14">
        <ProductGallery
          product={product}
          selectedImage={selectedImage}
          onSelectImage={setSelectedImage}
          isInWishlist={isInWishlist}
          isWishlistLoading={isWishlistLoading || wishlistMutation.isPending}
          onWishlistToggle={handleWishlistToggle}
        />

        <div>
          <ProductInfo product={product} />

          <ProductActions
            quantity={quantity}
            stock={product.stock}
            isAddingToCart={cartMutation.isPending}
            cartSuccess={cartMutation.isSuccess}
            cartError={
              cartMutation.isError
                ? getErrorMessage(
                    cartMutation.error,
                    "Unable to add this product to your cart.",
                  )
                : null
            }
            isComparing={false}
            compareMessage={compareMessage}
            wishlistError={wishlistMutation.isError}
            onQuantityChange={(value) => {
              setQuantity(Math.max(1, Math.min(product.stock, value)));
            }}
            onAddToCart={handleAddToCart}
            onCompare={handleCompare}
          />
        </div>
      </div>

      {/* Customer reviews */}
      <ProductReviews
        reviews={reviews}
        isLoading={isReviewsLoading}
        isError={isReviewsError}
        onRetry={() => refetchReviews()}
        isLoggedIn={Boolean(user)}
        currentUserId={user?.id}
        rating={reviewRating}
        comment={reviewComment}
        isSubmitting={reviewMutation.isPending}
        submitError={reviewSubmitError}
        onRatingChange={setReviewRating}
        onCommentChange={setReviewComment}
        onSubmit={handleReviewSubmit}
        updatingReviewId={
          updateReviewMutation.isPending
            ? (updateReviewMutation.variables?.reviewId ?? null)
            : null
        }
        deletingReviewId={
          deleteReviewMutation.isPending
            ? (deleteReviewMutation.variables ?? null)
            : null
        }
        onUpdate={handleUpdateReview}
        onDelete={handleDeleteReview}
      />
    </main>
  );
}
