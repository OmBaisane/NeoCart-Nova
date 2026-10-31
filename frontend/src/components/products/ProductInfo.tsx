import { CheckCircle, Star, XCircle } from "lucide-react";
import { ProductItem } from "@/components/ui/ProductCard";

interface ProductInfoProps {
  product: ProductItem;
}

export default function ProductInfo({ product }: ProductInfoProps) {
  const hasDiscount =
    product.discountPrice !== undefined &&
    product.discountPrice > 0 &&
    product.discountPrice < product.price;

  const currentPrice = hasDiscount ? product.discountPrice! : product.price;

  return (
    <div className="flex flex-col">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {product.category && (
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            {product.category.name}
          </span>
        )}

        {product.stock > 0 ? (
          <span className="flex items-center gap-1 text-xs font-medium text-green-600">
            <CheckCircle className="h-3.5 w-3.5" />
            In Stock
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs font-medium text-destructive">
            <XCircle className="h-3.5 w-3.5" />
            Out of Stock
          </span>
        )}
      </div>

      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        {product.name}
      </h1>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, index) => (
            <Star
              key={index}
              className={`h-4 w-4 ${
                index < Math.round(product.rating || 0)
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-muted-foreground"
              }`}
            />
          ))}
        </div>

        <span className="text-sm text-muted-foreground">
          {product.rating > 0 ? product.rating.toFixed(1) : "No ratings"} (
          {product.reviewCount} reviews)
        </span>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <span className="text-3xl font-bold">
          ₹{currentPrice.toLocaleString("en-IN")}
        </span>

        {hasDiscount && (
          <span className="text-lg text-muted-foreground line-through">
            ₹{product.price.toLocaleString("en-IN")}
          </span>
        )}
      </div>

      <div className="mt-6">
        <h2 className="mb-2 font-semibold">Description</h2>
        <p className="whitespace-pre-line leading-relaxed text-muted-foreground">
          {product.description}
        </p>
      </div>
    </div>
  );
}
