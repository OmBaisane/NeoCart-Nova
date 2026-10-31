"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useDebounce } from "@/hooks/useDebounce";
import { Logo } from "@/components/layout/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import {
  Search,
  ShoppingCart,
  User as UserIcon,
  LogOut,
  ShieldCheck,
  Package,
  Menu,
  X,
  ChevronDown,
  Loader2,
  ArrowRight,
  Layers,
  Heart,
  ArrowLeftRight,
} from "lucide-react";

interface CategoryItem {
  _id: string;
  name: string;
  slug: string;
}

interface ProductSuggestion {
  _id: string;
  name: string;
  slug: string;
  price: number;
  discountPrice?: number;
  images: string[];
  stock: number;
  category?: {
    _id: string;
    name: string;
    slug?: string;
  };
}

export const Navbar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [compareCount, setCompareCount] = useState(0);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const categoryMenuRef = useRef<HTMLDivElement>(null);
  const debouncedSearch = useDebounce(searchQuery.trim(), 300);

  // Fetch live debounced suggestions
  const { data: suggestionsData, isFetching: isSearching } = useQuery<{
    success: boolean;
    count: number;
    suggestions: ProductSuggestion[];
  }>({
    queryKey: ["product-suggestions", debouncedSearch],
    queryFn: async () => {
      if (debouncedSearch.length < 2) {
        return { success: true, count: 0, suggestions: [] };
      }

      const res = await api.get(
        `/products/suggestions?q=${encodeURIComponent(debouncedSearch)}`,
      );

      return res.data;
    },
    enabled: debouncedSearch.length >= 2,
    staleTime: 1000 * 60,
  });

  const suggestions = suggestionsData?.suggestions || [];

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsSearchFocused(false);
      }

      if (
        categoryMenuRef.current &&
        !categoryMenuRef.current.contains(event.target as Node)
      ) {
        setCategoryMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Compare count synchronization
  useEffect(() => {
    const updateCompareCount = () => {
      try {
        const stored = localStorage.getItem("neocart_compare");

        if (!stored) {
          setCompareCount(0);
          return;
        }

        const parsed: unknown = JSON.parse(stored);

        if (!Array.isArray(parsed)) {
          setCompareCount(0);
          localStorage.removeItem("neocart_compare");
          return;
        }

        const validIds = parsed.filter(
          (id): id is string => typeof id === "string" && id.length > 0,
        );

        const uniqueIds = [...new Set(validIds)].slice(0, 4);

        setCompareCount(uniqueIds.length);

        localStorage.setItem("neocart_compare", JSON.stringify(uniqueIds));
      } catch {
        setCompareCount(0);
        localStorage.removeItem("neocart_compare");
      }
    };

    updateCompareCount();

    window.addEventListener("storage", updateCompareCount);

    return () => {
      window.removeEventListener("storage", updateCompareCount);
    };
  }, [pathname]);

  // Cart total items count
  const { data: cartData } = useQuery({
    queryKey: ["cart"],
    queryFn: async () => {
      const res = await api.get("/cart");
      return res.data?.cart;
    },
    enabled: !!user,
    staleTime: 0,
  });

  const cartItemCount = cartData?.totalItems || 0;

  // Wishlist total items count
  const { data: wishlistData } = useQuery({
    queryKey: ["wishlist"],
    queryFn: async () => {
      const res = await api.get("/wishlist");
      return res.data;
    },
    enabled: !!user,
    staleTime: 1000 * 60,
  });

  const wishlistItemCount = wishlistData?.count || 0;

  // Fetch navigation categories
  const { data: categories } = useQuery<CategoryItem[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await api.get("/categories");
      return res.data?.categories || [];
    },
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (searchQuery.trim()) {
      setIsSearchFocused(false);
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setMobileMenuOpen(false);
    }
  };

  const handleSelectSuggestion = (slug: string) => {
    setIsSearchFocused(false);
    setSearchQuery("");
    router.push(`/products/${slug}`);
  };

  const handleLogout = async () => {
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
    await logout();
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md transition-colors duration-200 dark:border-slate-800/80 dark:bg-slate-950/90">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-3 sm:gap-4 sm:px-6 lg:px-8">
        {/* Logo and Desktop Navigation */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-6">
          <Logo size="md" />

          <nav className="hidden items-center gap-1 md:flex">
            <Link
              href="/products"
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              Catalog
            </Link>

            {categories && categories.length > 0 && (
              <div ref={categoryMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setCategoryMenuOpen((prev) => !prev)}
                  className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                >
                  <span>Categories</span>
                  <ChevronDown className="h-3 w-3 text-slate-400" />
                </button>

                {categoryMenuOpen && (
                  <div className="absolute left-0 z-50 mt-2 w-48 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl transition dark:border-slate-800 dark:bg-slate-900">
                    {categories.map((cat) => (
                      <Link
                        key={cat._id}
                        href={`/products?category=${cat.slug}`}
                        onClick={() => setCategoryMenuOpen(false)}
                        className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 hover:text-brand-blue dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-cyan-400"
                      >
                        <Layers className="h-3.5 w-3.5 text-slate-400" />
                        <span>{cat.name}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </nav>
        </div>

        {/* Desktop Search */}
        <div
          ref={searchContainerRef}
          className="relative mx-6 hidden max-w-md flex-1 sm:max-w-sm md:block"
        >
          <form onSubmit={handleSearchSubmit}>
            <input
              type="text"
              placeholder="Search keyboards, audio, gear..."
              value={searchQuery}
              onFocus={() => setIsSearchFocused(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchFocused(true);
              }}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/80 py-2 pl-9 pr-9 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-blue focus:bg-white focus:ring-2 focus:ring-brand-blue/10 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-cyan-500 dark:focus:bg-slate-900"
            />

            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-slate-500" />

            {isSearching && (
              <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-brand-blue dark:text-cyan-400" />
            )}
          </form>

          {/* Search Suggestions */}
          {isSearchFocused && debouncedSearch.length >= 2 && (
            <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl transition-all dark:border-slate-800 dark:bg-slate-900">
              {suggestions.length > 0 ? (
                <div className="py-2">
                  <div className="px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Live Catalog Matches ({suggestions.length})
                  </div>

                  <div className="max-h-72 divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800/60">
                    {suggestions.map((item) => (
                      <button
                        key={item._id}
                        type="button"
                        onClick={() => handleSelectSuggestion(item.slug)}
                        className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/70"
                      >
                        <img
                          src={
                            item.images?.[0] ||
                            "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80"
                          }
                          alt={item.name}
                          className="h-9 w-9 shrink-0 rounded-lg border border-slate-100 bg-slate-100 object-cover dark:border-slate-800 dark:bg-slate-800"
                        />

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-bold text-slate-900 dark:text-white">
                            {item.name}
                          </p>

                          <div className="mt-0.5 flex items-center gap-2 text-[11px]">
                            <span className="font-extrabold text-brand-blue dark:text-cyan-400">
                              ₹
                              {(
                                item.discountPrice || item.price
                              ).toLocaleString("en-IN")}
                            </span>

                            {item.category?.name && (
                              <span className="truncate text-[10px] text-slate-400 dark:text-slate-500">
                                in {item.category.name}
                              </span>
                            )}
                          </div>
                        </div>

                        {item.stock > 0 ? (
                          <span className="shrink-0 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                            In Stock
                          </span>
                        ) : (
                          <span className="shrink-0 rounded-md bg-rose-50 px-1.5 py-0.5 text-[9px] font-bold text-rose-700 dark:bg-rose-950/60 dark:text-rose-400">
                            Out
                          </span>
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="border-t border-slate-100 p-2 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={handleSearchSubmit}
                      className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-50 py-2 text-xs font-bold text-brand-blue hover:bg-blue-50 dark:bg-slate-800/70 dark:text-cyan-400 dark:hover:bg-slate-800"
                    >
                      <span>
                        View all results for &quot;{debouncedSearch}&quot;
                      </span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ) : !isSearching ? (
                <div className="p-4 text-center text-xs text-slate-400 dark:text-slate-500">
                  No matching items found for &quot;{debouncedSearch}&quot;
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex shrink-0 items-center gap-1 sm:gap-3">
          {/* Theme Toggle - Hidden on very small screens */}
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>

          {/* Compare - Desktop Only */}
          <Link
            href="/compare"
            className="relative hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200/80 text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 md:flex dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
            aria-label={`Compare products${compareCount > 0 ? `, ${compareCount} selected` : ""}`}
          >
            <ArrowLeftRight className="h-4 w-4" />

            {compareCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-blue px-1 text-[10px] font-extrabold text-white">
                {compareCount}
              </span>
            )}
          </Link>

          {/* Wishlist - Desktop Only */}
          <Link
            href="/wishlist"
            className="relative hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200/80 text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 sm:flex dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
            aria-label="Wishlist"
          >
            <Heart className="h-4 w-4" />

            {wishlistItemCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-extrabold text-white">
                {wishlistItemCount}
              </span>
            )}
          </Link>

          {/* Cart */}
          <Link
            href="/cart"
            className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200/80 text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
            aria-label="Shopping Cart"
          >
            <ShoppingCart className="h-4 w-4" />

            {cartItemCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-blue px-1 text-[10px] font-extrabold text-white">
                {cartItemCount}
              </span>
            )}
          </Link>

          {/* User Account */}
          {user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-50 py-1.5 pl-2 pr-2.5 text-xs font-semibold text-slate-800 transition hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-blue text-[11px] font-bold uppercase text-white dark:bg-cyan-600">
                  {user.name.charAt(0)}
                </div>

                <span className="hidden max-w-24 truncate sm:inline">
                  {user.name}
                </span>

                <ChevronDown className="hidden h-3 w-3 text-slate-400 sm:block dark:text-slate-500" />
              </button>

              {userDropdownOpen && (
                <div
                  className="absolute right-0 z-50 mt-2 w-48 rounded-2xl border border-slate-200 bg-white py-2 shadow-xl dark:border-slate-800 dark:bg-slate-900"
                  onMouseLeave={() => setUserDropdownOpen(false)}
                >
                  <div className="border-b border-slate-100 px-4 py-2 dark:border-slate-800">
                    <p className="truncate text-xs font-bold text-slate-900 dark:text-white">
                      {user.name}
                    </p>
                    <p className="truncate text-[10px] text-slate-400 dark:text-slate-500">
                      {user.email}
                    </p>
                  </div>

                  {user.role === "admin" && (
                    <Link
                      href="/admin"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-brand-blue transition hover:bg-blue-50 dark:text-cyan-400 dark:hover:bg-slate-800"
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />
                      <span>Admin Control</span>
                    </Link>
                  )}

                  <Link
                    href="/orders"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    <Package className="h-3.5 w-3.5 text-slate-400" />
                    <span>My Orders</span>
                  </Link>

                  <Link
                    href="/profile"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    <UserIcon className="h-3.5 w-3.5 text-slate-400" />
                    <span>Profile Settings</span>
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-xs font-semibold text-rose-600 transition hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="flex shrink-0 items-center gap-1 rounded-xl bg-slate-900 px-2.5 py-2 text-xs font-bold text-white transition hover:bg-blue-600 sm:gap-1.5 sm:px-3.5 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-blue-600"
            >
              <UserIcon className="h-3.5 w-3.5" />
              <span>Sign In</span>
            </Link>
          )}

          {/* Mobile Menu Trigger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200/80 text-slate-700 md:hidden dark:border-slate-800 dark:text-slate-300"
            aria-label={
              mobileMenuOpen ? "Close mobile menu" : "Open mobile menu"
            }
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-4 md:hidden dark:border-slate-800 dark:bg-slate-950">
          <form onSubmit={handleSearchSubmit} className="relative mb-4">
            <input
              type="text"
              placeholder="Search catalog..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-xs text-slate-900 outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
            />

            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          </form>

          <nav className="flex flex-col space-y-1">
            <Link
              href="/products"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              All Products
            </Link>

            <Link
              href="/compare"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <span className="flex items-center gap-2">
                <ArrowLeftRight className="h-4 w-4 text-slate-500" />
                Compare Products
              </span>

              {compareCount > 0 && (
                <span className="rounded-full bg-brand-blue px-2 py-0.5 text-[10px] font-bold text-white">
                  {compareCount}
                </span>
              )}
            </Link>

            <Link
              href="/wishlist"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <span className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-slate-500" />
                Wishlist
              </span>

              {wishlistItemCount > 0 && (
                <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white">
                  {wishlistItemCount}
                </span>
              )}
            </Link>

            {categories?.map((cat) => (
              <Link
                key={cat._id}
                href={`/products?category=${cat.slug}`}
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                {cat.name}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
};
