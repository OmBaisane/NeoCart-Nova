"use client";

import { Heart, Loader2 } from "lucide-react";
import { ProductItem } from "@/components/ui/ProductCard";

interface ProductGalleryProps {
  product: ProductItem;
  selectedImage: string | null;
  onSelectImage: (image: string) => void;
  isInWishlist: boolean;
  isWishlistLoading: boolean;
  onWishlistToggle: () => void;
}

export default function ProductGallery({
  product,
  selectedImage,
  onSelectImage,
  isInWishlist,
  isWishlistLoading,
  onWishlistToggle,
}: ProductGalleryProps) {
  const hasDiscount =
    product.discountPrice !== undefined &&
    product.discountPrice > 0 &&
    product.discountPrice < product.price;

  const discountPercentage = hasDiscount
    ? Math.round(
        ((product.price - product.discountPrice!) / product.price) * 100,
      )
    : 0;

  const activeImage = selectedImage || product.images?.[0];

  return (
    <div className="space-y-4">
      <div className="relative aspect-square overflow-hidden rounded-2xl border border-border bg-muted">
        {activeImage ? (
          <img
            src={activeImage}
            alt={product.name}
            className="h-full w-full object-contain p-6"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            No image available
          </div>
        )}

        {hasDiscount && (
          <span className="absolute left-4 top-4 rounded-full bg-destructive px-3 py-1 text-sm font-bold text-white">
            {discountPercentage}% OFF
          </span>
        )}

        <button
          type="button"
          onClick={onWishlistToggle}
          disabled={isWishlistLoading}
          aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={isInWishlist}
          className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background/90 shadow-md transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isWishlistLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Heart
              className={`h-5 w-5 transition ${
                isInWishlist ? "fill-red-500 text-red-500" : "text-foreground"
              }`}
            />
          )}
        </button>
      </div>

      {product.images && product.images.length > 1 && (
        <div className="flex flex-wrap gap-3">
          {product.images.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={() => onSelectImage(image)}
              aria-label={`View product image ${index + 1}`}
              aria-pressed={activeImage === image}
              className={`h-20 w-20 overflow-hidden rounded-lg border-2 bg-muted transition ${
                activeImage === image
                  ? "border-primary"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <img
                src={image}
                alt={`${product.name} ${index + 1}`}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
