"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { ProductCard, ProductItem } from "@/components/ui/ProductCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Heart, Loader2, ArrowRight } from "lucide-react";

export default function WishlistPage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();

  // Redirect to login if unauthenticated
  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push("/login?redirect=/wishlist");
    }
  }, [user, isAuthLoading, router]);

  const { data, isLoading } = useQuery<{
    success: boolean;
    count: number;
    products: ProductItem[];
  }>({
    queryKey: ["wishlist"],
    queryFn: async () => {
      const res = await api.get("/wishlist");
      return res.data;
    },
    enabled: !!user,
  });

  if (isAuthLoading || (user && isLoading)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-blue dark:text-cyan-400" />
      </div>
    );
  }

  if (!user) {
    return null; // Handled by useEffect redirect
  }

  const products = data?.products || [];

  return (
    <main className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="border-b border-slate-200 pb-4 dark:border-slate-800">
        <h1 className="text-xl font-extrabold tracking-tight text-brand-charcoal sm:text-3xl dark:text-white flex items-center gap-3">
          <Heart className="h-6 w-6 sm:h-8 sm:w-8 text-rose-500 fill-rose-500/20" />
          My Wishlist
        </h1>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Save your favorite gear and keep track of availability and price
          drops.
        </p>
      </div>

      {products.length === 0 ? (
        <div className="py-12 sm:py-20">
          <EmptyState
            icon={Heart}
            title="Your Wishlist is Empty"
            description="You haven't saved any products yet. Browse our catalog and click the heart icon to save items for later."
            actionLabel="Explore Catalog"
            actionHref="/products"
          />
        </div>
      ) : (
        <div className="mt-6 sm:mt-8 space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 sm:gap-6">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>

          <div className="flex justify-center border-t border-slate-200 pt-8 dark:border-slate-800">
            <Link
              href="/products"
              className="flex items-center gap-2 rounded-xl bg-slate-100 px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <span>Continue Shopping</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
