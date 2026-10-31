"use client";

import Link from "next/link";
import { Star, Loader2 } from "lucide-react";

interface ReviewFormProps {
  isLoggedIn: boolean;
  rating: number;
  comment: string;
  isSubmitting: boolean;
  error: string | null;
  onRatingChange: (rating: number) => void;
  onCommentChange: (comment: string) => void;
  onSubmit: () => void;
}

export default function ReviewForm({
  isLoggedIn,
  rating,
  comment,
  isSubmitting,
  error,
  onRatingChange,
  onCommentChange,
  onSubmit,
}: ReviewFormProps) {
  if (!isLoggedIn) {
    return (
      <div className="rounded-xl border border-border bg-muted/30 p-5">
        <p className="text-sm text-muted-foreground">
          Please log in to write a review.
        </p>
        <Link
          href="/login"
          className="mt-3 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          Log In
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border p-5">
      <h3 className="text-lg font-semibold">Write a Review</h3>

      <div className="mt-4">
        <p className="mb-2 text-sm font-medium">Your Rating</p>
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, index) => {
            const value = index + 1;

            return (
              <button
                key={value}
                type="button"
                onClick={() => onRatingChange(value)}
                aria-label={`Rate ${value} out of 5`}
                aria-pressed={rating === value}
                className="rounded p-1 transition hover:scale-110"
              >
                <Star
                  className={`h-6 w-6 ${
                    value <= rating
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted-foreground"
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4">
        <label
          htmlFor="review-comment"
          className="mb-2 block text-sm font-medium"
        >
          Your Review
        </label>
        <textarea
          id="review-comment"
          value={comment}
          onChange={(event) => onCommentChange(event.target.value)}
          rows={4}
          maxLength={2000}
          placeholder="Share your experience with this product..."
          className="w-full resize-y rounded-lg border border-border bg-background p-3 text-sm outline-none transition focus:border-primary"
        />
        <p className="mt-1 text-right text-xs text-muted-foreground">
          {comment.length}/2000
        </p>
      </div>

      {error && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={onSubmit}
        disabled={isSubmitting || rating < 1 || !comment.trim()}
        className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
        Submit Review
      </button>
    </div>
  );
}
