"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
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
} from "lucide-react";

interface CategoryItem {
  _id: string;
  name: string;
  slug: string;
}

export const Navbar = () => {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

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
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setMobileMenuOpen(false);
    }
  };

  const handleLogout = async () => {
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
    await logout();
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md transition-colors duration-200 dark:border-slate-800 dark:bg-slate-950/90">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo & Left Nav */}
        <div className="flex items-center gap-6">
          <Logo size="md" />

          {/* Desktop Categories Links */}
          <nav className="hidden items-center gap-1.5 lg:flex">
            <Link
              href="/products"
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              All Products
            </Link>
            {categories?.slice(0, 4).map((cat) => (
              <Link
                key={cat._id}
                href={`/products?category=${cat.slug}`}
                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                {cat.name}
              </Link>
            ))}
          </nav>
        </div>

        {/* Global Search Bar (Desktop) */}
        <form
          onSubmit={handleSearchSubmit}
          className="relative hidden max-w-xs flex-1 md:block lg:max-w-sm"
        >
          <input
            type="text"
            placeholder="Search verified products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2 pl-9 pr-4 text-xs text-slate-900 outline-none transition focus:border-brand-blue focus:bg-white dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-cyan-500 dark:focus:bg-slate-900"
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-slate-500" />
        </form>

        {/* Actions & Utilities */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Theme Switcher Toggle */}
          <ThemeToggle />

          {/* Cart Icon CTA */}
          <Link
            href="/cart"
            className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
            aria-label="Shopping Cart"
          >
            <ShoppingCart className="h-4 w-4" />
            {cartItemCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-blue px-1 text-[10px] font-extrabold text-white">
                {cartItemCount}
              </span>
            )}
          </Link>

          {/* User Account Dropdown / Auth Link */}
          {user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-2 pr-2.5 text-xs font-semibold text-slate-800 transition hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-blue text-[11px] font-bold text-white uppercase dark:bg-cyan-600">
                  {user.name.charAt(0)}
                </div>
                <span className="hidden max-w-24 truncate sm:inline">
                  {user.name}
                </span>
                <ChevronDown className="h-3 w-3 text-slate-400 dark:text-slate-500" />
              </button>

              {userDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-48 rounded-2xl border border-slate-200 bg-white py-2 shadow-xl dark:border-slate-800 dark:bg-slate-900"
                  onMouseLeave={() => setUserDropdownOpen(false)}
                >
                  <div className="border-b border-slate-100 px-4 py-2 dark:border-slate-800">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {user.name}
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
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
              className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-blue-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-blue-600"
            >
              <UserIcon className="h-3.5 w-3.5" />
              <span>Sign In</span>
            </Link>
          )}

          {/* Mobile Menu Trigger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-700 md:hidden dark:border-slate-800 dark:text-slate-300"
            aria-label="Open Mobile Menu"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-4 md:hidden dark:border-slate-800 dark:bg-slate-950">
          <form onSubmit={handleSearchSubmit} className="relative mb-4">
            <input
              type="text"
              placeholder="Search catalog..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2 pl-9 pr-4 text-xs text-slate-900 outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          </form>

          <nav className="flex flex-col space-y-1">
            <Link
              href="/products"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              All Products
            </Link>
            {categories?.map((cat) => (
              <Link
                key={cat._id}
                href={`/products?category=${cat.slug}`}
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
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
