import {
  AlertCircle,
  CheckCircle,
  Loader2,
  Minus,
  Plus,
  Scale,
  ShieldCheck,
  ShoppingCart,
  Truck,
} from "lucide-react";

interface ProductActionsProps {
  quantity: number;
  stock: number;
  isAddingToCart: boolean;
  cartSuccess: boolean;
  cartError: string | null;
  isComparing: boolean;
  compareMessage: {
    text: string;
    error: boolean;
  } | null;
  wishlistError: boolean;
  onQuantityChange: (quantity: number) => void;
  onAddToCart: () => void;
  onCompare: () => void;
}

export default function ProductActions({
  quantity,
  stock,
  isAddingToCart,
  cartSuccess,
  cartError,
  isComparing,
  compareMessage,
  wishlistError,
  onQuantityChange,
  onAddToCart,
  onCompare,
}: ProductActionsProps) {
  const isOutOfStock = stock <= 0;

  return (
    <>
      <div className="mt-8">
        <label className="mb-3 block text-sm font-semibold">Quantity</label>

        <div className="inline-flex items-center rounded-lg border border-border">
          <button
            type="button"
            onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
            disabled={quantity <= 1 || isOutOfStock}
            aria-label="Decrease quantity"
            className="p-3 hover:bg-muted disabled:opacity-40"
          >
            <Minus className="h-4 w-4" />
          </button>

          <span className="min-w-12 text-center font-semibold">{quantity}</span>

          <button
            type="button"
            onClick={() => onQuantityChange(Math.min(stock, quantity + 1))}
            disabled={quantity >= stock || isOutOfStock}
            aria-label="Increase quantity"
            className="p-3 hover:bg-muted disabled:opacity-40"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onAddToCart}
          disabled={isOutOfStock || isAddingToCart}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-4 font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isAddingToCart ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <ShoppingCart className="h-5 w-5" />
          )}
          {isOutOfStock ? "Out of Stock" : "Add to Cart"}
        </button>

        <button
          type="button"
          onClick={onCompare}
          disabled={isComparing}
          className="flex items-center justify-center gap-2 rounded-xl border border-border px-6 py-4 font-semibold transition hover:bg-muted disabled:opacity-50"
        >
          <Scale className="h-5 w-5" />
          Compare
        </button>
      </div>

      {cartSuccess && (
        <p className="mt-3 flex items-center gap-2 text-sm text-green-600">
          <CheckCircle className="h-4 w-4" />
          Product added to cart successfully.
        </p>
      )}

      {cartError && (
        <p className="mt-3 flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {cartError}
        </p>
      )}

      {compareMessage && (
        <p
          className={`mt-3 text-sm ${
            compareMessage.error ? "text-destructive" : "text-green-600"
          }`}
        >
          {compareMessage.text}
        </p>
      )}

      {wishlistError && (
        <p className="mt-3 flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          Unable to update wishlist. Please try again.
        </p>
      )}

      <div className="mt-8 grid grid-cols-1 gap-4 border-t border-border pt-6 sm:grid-cols-2">
        <div className="flex items-start gap-3">
          <Truck className="mt-0.5 h-5 w-5 text-primary" />
          <div>
            <p className="text-sm font-semibold">Fast Delivery</p>
            <p className="text-xs text-muted-foreground">
              Reliable delivery to your doorstep.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 text-primary" />
          <div>
            <p className="text-sm font-semibold">Secure Shopping</p>
            <p className="text-xs text-muted-foreground">
              Your shopping experience is protected.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
