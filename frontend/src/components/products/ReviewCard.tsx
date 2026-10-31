"use client";

import { useState } from "react";
import { Star, Pencil, Trash2, Loader2, X, Check } from "lucide-react";

export interface ReviewItem {
  _id: string;
  rating: number;
  comment: string;
  createdAt: string;
  user?: {
    _id: string;
    name: string;
    avatar?: string;
  };
}

interface ReviewCardProps {
  review: ReviewItem;
  isOwnReview: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  onUpdate: (reviewId: string, rating: number, comment: string) => void;
  onDelete: (reviewId: string) => void;
}

export default function ReviewCard({
  review,
  isOwnReview,
  isUpdating,
  isDeleting,
  onUpdate,
  onDelete,
}: ReviewCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [rating, setRating] = useState(review.rating);
  const [comment, setComment] = useState(review.comment);

  const handleCancel = () => {
    setRating(review.rating);
    setComment(review.comment);
    setIsEditing(false);
  };

  const handleSave = () => {
    if (rating < 1 || rating > 5 || !comment.trim()) return;

    onUpdate(review._id, rating, comment.trim());
    setIsEditing(false);
  };

  const formattedDate = review.createdAt
    ? new Date(review.createdAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

  return (
    <article className="rounded-xl border border-border p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {review.user?.avatar ? (
            <img
              src={review.user.avatar}
              alt=""
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
              {review.user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
          )}

          <div>
            <p className="font-semibold">
              {review.user?.name || "Customer"}
              {isOwnReview && (
                <span className="ml-2 text-xs font-normal text-primary">
                  (You)
                </span>
              )}
            </p>
            <p className="text-xs text-muted-foreground">{formattedDate}</p>
          </div>
        </div>

        {!isEditing && (
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, index) => (
              <Star
                key={index}
                className={`h-4 w-4 ${
                  index < review.rating
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-muted-foreground"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, index) => {
              const value = index + 1;

              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  aria-label={`Rate ${value} out of 5`}
                  aria-pressed={rating === value}
                  className="rounded p-1"
                >
                  <Star
                    className={`h-5 w-5 ${
                      value <= rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground"
                    }`}
                  />
                </button>
              );
            })}
          </div>

          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            rows={4}
            maxLength={2000}
            aria-label="Edit your review"
            className="w-full resize-y rounded-lg border border-border bg-background p-3 text-sm outline-none focus:border-primary"
          />

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={isUpdating || rating < 1 || !comment.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              {isUpdating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              Save
            </button>

            <button
              type="button"
              onClick={handleCancel}
              disabled={isUpdating}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
            {review.comment}
          </p>

          {isOwnReview && (
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                disabled={isUpdating || isDeleting}
                className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium transition hover:bg-muted disabled:opacity-50"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </button>

              <button
                type="button"
                onClick={() => onDelete(review._id)}
                disabled={isUpdating || isDeleting}
                className="inline-flex items-center gap-2 rounded-lg border border-destructive/30 px-3 py-2 text-xs font-medium text-destructive transition hover:bg-destructive/10 disabled:opacity-50"
              >
                {isDeleting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                Delete
              </button>
            </div>
          )}
        </>
      )}
    </article>
  );
}
