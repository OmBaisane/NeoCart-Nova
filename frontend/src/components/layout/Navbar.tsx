"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Logo } from "@/components/layout/Logo";
import {
  Search,
  ShoppingCart,
  User as UserIcon,
  LogOut,
  Shield,
  Menu,
  X,
  Package,
} from "lucide-react";

export const Navbar = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: cartData } = useQuery({
    queryKey: ["cart"],
    queryFn: async () => {
      const res = await api.get("/cart");
      return res.data?.cart;
    },
    enabled: !!user,
  });

  const cartCount = cartData?.totalItems || 0;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setMobileMenuOpen(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setProfileDropdownOpen(false);
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Logo />
          <nav
            aria-label="Main Navigation"
            className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600"
          >
            <Link href="/products" className="transition hover:text-brand-blue">
              Catalog
            </Link>
            <Link
              href="/products?sort=newest"
              className="transition hover:text-brand-blue"
            >
              New Arrivals
            </Link>
          </nav>
        </div>

        <form
          onSubmit={handleSearch}
          className="hidden sm:flex flex-1 max-w-md relative"
          role="search"
        >
          <input
            type="search"
            aria-label="Search product catalog"
            placeholder="Search products, brands, essentials..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-full border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-xs text-slate-800 outline-none transition focus:border-brand-blue focus:bg-white"
          />
          <Search
            className="absolute left-3 top-2.5 h-4 w-4 text-slate-400"
            aria-hidden="true"
          />
        </form>

        <div className="flex items-center gap-3">
          <Link
            href="/cart"
            aria-label={`Shopping bag containing ${cartCount} items`}
            className="relative flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-700 transition hover:bg-slate-50 hover:text-brand-blue"
          >
            <ShoppingCart className="h-4 w-4" aria-hidden="true" />
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-blue px-1 font-mono text-[10px] font-bold text-white shadow-xs">
                {cartCount}
              </span>
            )}
          </Link>

          {user ? (
            <div className="relative">
              <button
                type="button"
                aria-label="User account menu"
                aria-haspopup="menu"
                aria-expanded={profileDropdownOpen}
                aria-controls="profile-menu-dropdown"
                onClick={() => setProfileDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2 rounded-full border border-slate-200 p-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 sm:px-3 sm:py-1.5"
              >
                <div
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-blue text-[11px] font-bold text-white uppercase"
                  aria-hidden="true"
                >
                  {user.name ? user.name.charAt(0) : "U"}
                </div>
                <span className="hidden sm:inline max-w-28 truncate">
                  {user.name}
                </span>
              </button>

              {profileDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    aria-hidden="true"
                    onClick={() => setProfileDropdownOpen(false)}
                  />
                  <div
                    id="profile-menu-dropdown"
                    role="menu"
                    className="absolute right-0 top-full z-50 mt-2 w-48 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl"
                  >
                    <div className="border-b border-slate-100 px-3 py-2">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {user.name}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">
                        {user.email}
                      </p>
                    </div>

                    <Link
                      href="/profile"
                      role="menuitem"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 hover:text-brand-blue"
                    >
                      <UserIcon className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>My Profile</span>
                    </Link>

                    <Link
                      href="/orders"
                      role="menuitem"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 hover:text-brand-blue"
                    >
                      <Package className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>My Orders</span>
                    </Link>

                    {user.role === "admin" && (
                      <Link
                        href="/admin"
                        role="menuitem"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-brand-blue transition hover:bg-blue-50"
                      >
                        <Shield className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Admin Portal</span>
                      </Link>
                    )}

                    <div
                      className="my-1 border-t border-slate-100"
                      role="separator"
                    />

                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-medium text-rose-600 transition hover:bg-rose-50"
                    >
                      <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-xl px-3.5 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 hover:text-brand-charcoal"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="rounded-xl bg-brand-blue px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-blue-600"
              >
                Sign Up
              </Link>
            </div>
          )}

          <button
            type="button"
            aria-label="Toggle mobile menu"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav-menu"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 md:hidden hover:bg-slate-50"
          >
            {mobileMenuOpen ? (
              <X className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Menu className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <nav
          id="mobile-nav-menu"
          aria-label="Mobile Navigation"
          className="border-t border-slate-200 bg-white px-4 py-4 md:hidden space-y-4"
        >
          <form onSubmit={handleSearch} className="relative" role="search">
            <input
              type="search"
              aria-label="Search product catalog"
              placeholder="Search catalog..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs outline-none focus:border-brand-blue"
            />
            <Search
              className="absolute left-3 top-2.5 h-4 w-4 text-slate-400"
              aria-hidden="true"
            />
          </form>

          <div className="space-y-1">
            <Link
              href="/products"
              onClick={() => setMobileMenuOpen(false)}
              className="block rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              All Products
            </Link>
            <Link
              href="/products?sort=newest"
              onClick={() => setMobileMenuOpen(false)}
              className="block rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              New Arrivals
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
};
