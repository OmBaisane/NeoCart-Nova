"use client";

import { MessageSquare, Loader2, RefreshCw } from "lucide-react";
import ReviewForm from "@/components/products/ReviewForm";
import ReviewCard, { ReviewItem } from "@/components/products/ReviewCard";

interface ProductReviewsProps {
  reviews: ReviewItem[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  isLoggedIn: boolean;
  currentUserId?: string;
  rating: number;
  comment: string;
  isSubmitting: boolean;
  submitError: string | null;
  onRatingChange: (rating: number) => void;
  onCommentChange: (comment: string) => void;
  onSubmit: () => void;
  updatingReviewId: string | null;
  deletingReviewId: string | null;
  onUpdate: (reviewId: string, rating: number, comment: string) => void;
  onDelete: (reviewId: string) => void;
}

export default function ProductReviews({
  reviews,
  isLoading,
  isError,
  onRetry,
  isLoggedIn,
  currentUserId,
  rating,
  comment,
  isSubmitting,
  submitError,
  onRatingChange,
  onCommentChange,
  onSubmit,
  updatingReviewId,
  deletingReviewId,
  onUpdate,
  onDelete,
}: ProductReviewsProps) {
  return (
    <section className="mt-16 border-t border-border pt-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Customer Reviews</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Feedback and experiences from customers.
          </p>
        </div>

        <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
          {reviews.length} {reviews.length === 1 ? "Review" : "Reviews"}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[0.85fr_1.15fr]">
        <div>
          <ReviewForm
            isLoggedIn={isLoggedIn}
            rating={rating}
            comment={comment}
            isSubmitting={isSubmitting}
            error={submitError}
            onRatingChange={onRatingChange}
            onCommentChange={onCommentChange}
            onSubmit={onSubmit}
          />
        </div>

        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading reviews...
            </div>
          ) : isError ? (
            <div className="rounded-xl border border-border p-6 text-center">
              <p className="text-sm text-muted-foreground">
                Unable to load reviews.
              </p>
              <button
                type="button"
                onClick={onRetry}
                className="mt-3 inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </button>
            </div>
          ) : reviews.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center">
              <MessageSquare className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-3 font-medium">No reviews yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Be the first to share your experience.
              </p>
            </div>
          ) : (
            reviews.map((review) => (
              <ReviewCard
                key={review._id}
                review={review}
                isOwnReview={Boolean(
                  currentUserId && review.user?._id === currentUserId,
                )}
                isUpdating={updatingReviewId === review._id}
                isDeleting={deletingReviewId === review._id}
                onUpdate={onUpdate}
                onDelete={onDelete}
              />
            ))
          )}
        </div>
      </div>
    </section>
  );
}
